import Command from "../types/command.js";

// Commands
import * as help from "./utility/help.js";
import * as ping from "./utility/ping.js";
import * as rolecount from "./utility/rolecount.js";
import * as rolepicker from "./utility/rolepicker.js";
import * as avatar from "./utility/avatar.js";
import * as banner from "./utility/banner.js";
import * as userinfo from "./utility/userinfo.js";
import * as serverinfo from "./utility/serverinfo.js";
import * as welcome from "./utility/welcome.js";
import * as author from "./utility/author.js";

import * as purge from "./moderation/purge.js";
import * as clear from "./moderation/clear.js";
import * as ban from "./moderation/ban.js";
import * as unban from "./moderation/unban.js";
import * as kick from "./moderation/kick.js";

import * as _8ball from "./games/8ball.js";
import * as roll from "./games/roll.js";

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
  welcome,
  author,

  // Moderation
  purge,
  clear,
  ban,
  unban,
  kick,

  // Games
  "8ball": _8ball,
  roll,
};
