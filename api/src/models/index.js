import { Sequelize } from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import databaseConfig from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const config = databaseConfig[env];

const db = {};

// Initialize Sequelize
let sequelize;
if (config.use_env_variable) {
	sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
	sequelize = new Sequelize(
		config.database,
		config.username,
		config.password,
		config
	);
}

// Import all models dynamically
const modelFiles = fs
	.readdirSync(__dirname)
	.filter(
		(file) =>
			file.indexOf('.') !== 0 &&
			file !== 'index.js' &&
			file.slice(-3) === '.js'
	);

for (const file of modelFiles) {
	const modelPath = join(__dirname, file);
	// Convert Windows path to file:// URL for ES modules
	const modelUrl = pathToFileURL(modelPath).href;
	const model = await import(modelUrl);
	const initModel = model.default;
	
	if (typeof initModel === 'function') {
		const modelInstance = initModel(sequelize);
		db[modelInstance.name] = modelInstance;
	}
}

// Setup associations
Object.keys(db).forEach((modelName) => {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

