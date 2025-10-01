import Command from "../types/command";

// Commands
import * as help from "./utility/help";
import * as ping from "./utility/ping";
import * as rolecount from "./utility/rolecount";
import * as avatar from "./utility/avatar";
import * as banner from "./utility/banner";
import * as userinfo from "./utility/userinfo";
import * as serverinfo from "./utility/serverinfo";

export const commands: Record<string, Command> = {
  help,
  ping,
  rolecount,
  avatar,
  banner,
  userinfo,
  serverinfo,
};
