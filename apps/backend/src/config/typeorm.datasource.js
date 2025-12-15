"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
const database_config_1 = require("./database.config");
(0, dotenv_1.config)({
    path: process.env.DOTENV_PATH || '.env',
});
// Устанавливаем флаг для использования явных entities в CLI
process.env.TYPEORM_USE_EXPLICIT_ENTITIES = 'true';
const dataSource = new typeorm_1.DataSource(database_config_1.dataSourceConfig);
exports.default = dataSource;
//# sourceMappingURL=typeorm.datasource.js.map