import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";

import { execute as purgeExecute } from "./purge.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Delete a specified number of messages")
  .addIntegerOption((option) =>
    option
      .setName("number")
      .setDescription("Number of messages to delete (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

// Execute
export const execute = purgeExecute;
