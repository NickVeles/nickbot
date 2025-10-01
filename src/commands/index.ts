import Command from "../types/command";

// Commands
import * as ping from "./utility/ping";
import * as rolecount from "./utility/rolecount";
import * as avatar from "./utility/avatar";
import * as banner from "./utility/banner";

export const commands: Record<string, Command> = {
  ping,
  rolecount,
  avatar,
  banner,
};
