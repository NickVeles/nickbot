import Command from "../types/command";

// Commands
import * as help from "./utility/help";
import * as ping from "./utility/ping";
import * as rolecount from "./utility/rolecount";
import * as rolepicker from "./utility/rolepicker";
import * as avatar from "./utility/avatar";
import * as banner from "./utility/banner";
import * as userinfo from "./utility/userinfo";
import * as serverinfo from "./utility/serverinfo";

import * as purge from "./moderation/purge";

import * as _8ball from "./games/8ball";
import * as roll from "./games/roll";

export const commands: Record<string, Command> = {
  // Utility
  help,
  ping,
  rolecount,
  rolepicker,
  avatar,
  banner,
  userinfo,
  serverinfo,

  // Moderation
  purge,

  // Games
  "8ball": _8ball,
  roll,
};
