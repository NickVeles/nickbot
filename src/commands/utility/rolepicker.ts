import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  Role,
  MessageFlags,
  EmbedBuilder
} from 'discord.js';
import db from '../../database/index.js';

interface PickerConfig {
  id: string;
  guildId: string;
  roleIds: string[];
  multiple: boolean;
}

// Load picker from database
function loadPicker(pickerId: string): PickerConfig | null {
  try {
    const stmt = db.prepare('SELECT * FROM pickers WHERE id = ?');
    const result = stmt.get(pickerId) as any;
    
    if (result) {
      return {
        id: result.id,
        guildId: result.guildId,
        roleIds: JSON.parse(result.roleIds),
        multiple: result.multiple === 1
      };
    }
    return null;
  } catch (err) {
    console.error('Error loading picker:', err);
    return null;
  }
}

// Save picker to database
function savePicker(pickerConfig: PickerConfig) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO pickers (id, guildId, roleIds, multiple)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      pickerConfig.id,
      pickerConfig.guildId,
      JSON.stringify(pickerConfig.roleIds),
      pickerConfig.multiple ? 1 : 0
    );
  } catch (err) {
    console.error('Error saving picker:', err);
  }
}

// Command
export const data = new SlashCommandBuilder()
  .setName('rolepicker')
  .setDescription('Create a role picker dropdown menu')
  .addStringOption(option =>
    option
      .setName('text')
      .setDescription('Text to display above the dropdown')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('roles')
      .setDescription('Role IDs or mentions separated by spaces (e.g., @Role1 @Role2)')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('multiple')
      .setDescription('Allow users to select multiple roles?')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction: ChatInputCommandInteraction) {
  const text = interaction.options.getString('text', true);
  const rolesInput = interaction.options.getString('roles', true);
  const multiple = interaction.options.getBoolean('multiple', true);

  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Parse role IDs from input (handles both mentions and raw IDs)
  const roleIds = rolesInput.match(/\d{17,19}/g);
  
  if (!roleIds || roleIds.length === 0) {
    await interaction.reply({
      content: 'No valid roles found. Please mention roles or provide role IDs.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Fetch roles and validate
  const roles: Role[] = [];
  for (const roleId of roleIds) {
    try {
      const role = await interaction.guild.roles.fetch(roleId);
      if (role) {
        // Check if bot can manage this role
        const botMember = interaction.guild.members.me;
        if (botMember && role.position < botMember.roles.highest.position) {
          roles.push(role);
        }
      }
    } catch (err) {
      // Role not found, skip
    }
  }

  if (roles.length === 0) {
    await interaction.reply({
      content: 'No valid roles found or I don\'t have permission to manage these roles.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (roles.length > 25) {
    await interaction.reply({
      content: 'You can only add up to 25 roles in a dropdown menu.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Generate a unique picker ID
  const pickerId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store picker config in database
  const pickerConfig: PickerConfig = {
    id: pickerId,
    guildId: interaction.guild.id,
    roleIds: roles.map(r => r.id),
    multiple: multiple
  };
  
  savePicker(pickerConfig);

  // Create select menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`picker_${pickerId}`)
    .setPlaceholder('Select role(s)')
    .setMinValues(multiple ? 0 : 1)
    .setMaxValues(multiple ? roles.length : 1)
    .addOptions(
      roles.map(role => {
        const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
        const match = role.name.match(emojiRegex);
        
        let label = role.name;
        let emoji = '🎭';
        
        if (match) {
          emoji = match[0];
          label = role.name.slice(match[0].length).trim();
        }
        
        return {
          label: label,
          value: role.id,
          description: `Select to get the ${label} role`,
          emoji: emoji
        };
      })
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(text)
    .setFooter({ text: `${multiple ? 'Select multiple roles' : 'Select one role'} from the dropdown below` })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// Register the persistent handler
export function registerRolePickerHandler(client: any) {
  client.on('interactionCreate', async (interaction: StringSelectMenuInteraction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('picker_')) return;

    if (!interaction.guild || !interaction.member) return;

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('Failed to defer interaction:', err);
      return;
    }

    try {
      const pickerId = interaction.customId.replace('picker_', '');
      const pickerConfig = loadPicker(pickerId);

      if (!pickerConfig) {
        await interaction.editReply({
          content: 'This role picker is no longer available.'
        });
        return;
      }

      if (pickerConfig.guildId !== interaction.guild.id) {
        await interaction.editReply({
          content: 'This role picker cannot be used in this server.'
        });
        return;
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const selectedRoleIds = interaction.values;
      const roles: Role[] = [];

      for (const roleId of pickerConfig.roleIds) {
        try {
          const role = await interaction.guild.roles.fetch(roleId);
          if (role) roles.push(role);
        } catch (err) {
          // Role doesn't exist anymore
        }
      }

      if (pickerConfig.multiple === false) {
        const rolesToRemove = roles.filter(r => 
          member.roles.cache.has(r.id) && !selectedRoleIds.includes(r.id)
        );
        
        for (const role of rolesToRemove) {
          await member.roles.remove(role);
        }
      }

      const addedRoles: string[] = [];
      const removedRoles: string[] = [];

      for (const role of roles) {
        const hasRole = member.roles.cache.has(role.id);
        const shouldHave = selectedRoleIds.includes(role.id);

        if (shouldHave && !hasRole) {
          await member.roles.add(role);
          addedRoles.push(role.name);
        } else if (!shouldHave && hasRole && pickerConfig.multiple) {
          await member.roles.remove(role);
          removedRoles.push(role.name);
        }
      }

      let response = '';
      if (addedRoles.length > 0) {
        response += `✅ Added: ${addedRoles.join(', ')}\n`;
      }
      if (removedRoles.length > 0) {
        response += `❌ Removed: ${removedRoles.join(', ')}`;
      }
      if (!response) {
        response = 'No changes made to your roles.';
      }

      await interaction.editReply({ content: response });
    } catch (err) {
      console.error('Error managing roles:', err);
      try {
        await interaction.editReply({
          content: 'An error occurred while managing your roles. Make sure I have the proper permissions.'
        });
      } catch (replyErr) {
        console.error('Failed to send error message:', replyErr);
      }
    }
  });
}