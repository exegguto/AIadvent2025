import { promises as fs } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export async function readJson(path, defaultValue) {
	try {
		const data = await fs.readFile(path, 'utf8');
		return JSON.parse(data);
	} catch (e) {
		return defaultValue;
	}
}

export async function writeJson(path, data) {
	await fs.mkdir(dirname(path), { recursive: true });
	await fs.writeFile(path, JSON.stringify(data, null, 2));
}
