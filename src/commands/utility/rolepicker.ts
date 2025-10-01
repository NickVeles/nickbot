import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  Role,
  MessageFlags,
  EmbedBuilder
} from 'discord.js';

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

  // Create select menu with a persistent custom ID that includes role info
  const roleData = roles.map(r => r.id).join(',');
  const customId = `role_select_${multiple ? 'multi' : 'single'}_${Date.now()}`;
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Select role(s)')
    .setMinValues(multiple ? 0 : 1)
    .setMaxValues(multiple ? roles.length : 1)
    .addOptions(
      roles.map(role => {
        // Check if the first character is an emoji
        const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
        const match = role.name.match(emojiRegex);
        
        let label = role.name;
        let emoji = '🎭';
        
        if (match) {
          // Extract the emoji and remove it from the label
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

  // Create an embed for a nicer presentation
  const embed = new EmbedBuilder()
    .setColor(0x5865F2) // Discord blurple color
    .setTitle(text)
    .setFooter({ text: `${multiple ? 'Select multiple roles' : 'Select one role'} from the dropdown below` })
    .setTimestamp();

  // Reply with the role picker (non-ephemeral so it stays in channel)
  await interaction.reply({
    embeds: [embed],
    components: [row]
  });

  // Create collector for the select menu
  const message = await interaction.fetchReply();
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    filter: (i) => i.customId === customId,
    time: 0 // No timeout, works indefinitely
  });

  collector?.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
    if (!selectInteraction.guild || !selectInteraction.member) return;

    // CRITICAL: Defer within 3 seconds of the NEW interaction
    try {
      await selectInteraction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('Failed to defer interaction:', err);
      return;
    }

    try {
      const member = await selectInteraction.guild.members.fetch(selectInteraction.user.id);
      const selectedRoleIds = selectInteraction.values;

      if (!multiple) {
        // Single selection mode: remove all picker roles, add selected one
        const rolesToRemove = roles.filter(r => 
          member.roles.cache.has(r.id) && !selectedRoleIds.includes(r.id)
        );
        
        for (const role of rolesToRemove) {
          await member.roles.remove(role);
        }
      }

      // Add selected roles
      const addedRoles: string[] = [];
      const removedRoles: string[] = [];

      for (const role of roles) {
        const hasRole = member.roles.cache.has(role.id);
        const shouldHave = selectedRoleIds.includes(role.id);

        if (shouldHave && !hasRole) {
          await member.roles.add(role);
          addedRoles.push(role.name);
        } else if (!shouldHave && hasRole && multiple) {
          // In multiple mode, deselecting removes the role
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

      await selectInteraction.editReply({ content: response });
    } catch (err) {
      console.error('Error managing roles:', err);
      try {
        await selectInteraction.editReply({
          content: 'An error occurred while managing your roles. Make sure I have the proper permissions.'
        });
      } catch (replyErr) {
        console.error('Failed to send error message:', replyErr);
      }
    }
  });
}