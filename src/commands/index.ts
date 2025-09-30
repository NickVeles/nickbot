import Command from "../types/command";

// Commands
import * as ping from "./utility/ping";
import * as rolecount from "./utility/rolecount";

export const commands: Record<string, Command> = {
  ping,
  rolecount,
};
