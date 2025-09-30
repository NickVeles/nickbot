import Command from "../types/command";

// Commands
import * as ping from "./utility/ping";

export const commands: Record<string, Command> = {
  ping,
};
