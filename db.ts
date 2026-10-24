import { JSONFilePreset } from "lowdb/node";
import { config } from "./secrets";
const db = await JSONFilePreset(config.DB_LOCATION, {
    watched: {},
    hiddenTerms: []
});

export default db;