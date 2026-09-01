import fs from "fs";
import path from "path";

/**
 * Actualiza o agrega una variable en el archivo .env del proyecto
 */
export function updateEnvVariable(key: string, value: string): void {
  try {
    const envPath = path.join(process.cwd(), ".env");
    let content = "";

    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf8");
    }

    const keyRegex = new RegExp(`^${key}=.*$`, "m");
    const formattedValue = value.includes(" ") || value.includes('"') || value.includes("'")
      ? `"${value.replace(/"/g, '\\"')}"`
      : `"${value}"`;

    if (keyRegex.test(content)) {
      content = content.replace(keyRegex, `${key}=${formattedValue}`);
    } else {
      content = content.trimEnd() + `\n${key}=${formattedValue}\n`;
    }

    fs.writeFileSync(envPath, content, "utf8");
    process.env[key] = value;
  } catch (error) {
    console.error(`Error al actualizar variable de entorno ${key}:`, error);
    // Fallback: al menos actualizar en memoria de Node
    process.env[key] = value;
  }
}

/**
 * Obtiene el valor actual de una variable de entorno
 */
export function getEnvVariable(key: string): string | undefined {
  return process.env[key];
}
