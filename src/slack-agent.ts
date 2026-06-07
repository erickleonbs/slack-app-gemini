import { App } from '@slack/bolt';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve environment variables from the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const WORKSPACE_ROOT = '/Users/erickhipolito/Documents/Lilfy/lilfy-core';
const SKILLS_PATH = path.join(WORKSPACE_ROOT, '.agents/skills');
const WORKFLOWS_PATH = path.join(WORKSPACE_ROOT, '.agents/workflows');
const RULES_PATH = path.join(WORKSPACE_ROOT, '.gemini/rules');

// Initialize Slack App (Socket Mode)
const app = new App({
  token: process.env.SLACK_AUTH_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

/**
 * Executes a Gemini command and streams output to a Slack thread.
 * Enforces "Workflow First" and Skill Activation.
 */
async function executeAgentTask(prompt: string, say: any, threadTs: string, subProjectPath: string) {
  const finalPrompt = `
    [CONTEXT: ${subProjectPath}]
    [WORKSPACE_ROOT: ${WORKSPACE_ROOT}]
    [SKILLS_LIB: ${SKILLS_PATH}]
    [RULES_PATH: ${RULES_PATH}]
    
    INSTRUCCIÓN DE CUMPLIMIENTO CRÍTICO:
    1. REGLAS: Sigue estrictamente las reglas en ${RULES_PATH}/lilfy-architecture.md.
    2. SKILLS: Antes de realizar cambios complejos, identifica y ACTIVA las skills relevantes en ${SKILLS_PATH}.
    3. WORKFLOW FIRST: Si la tarea implica crear algo nuevo (componente, endpoint, tool, etc.), DEBES:
       a. Crear primero un archivo Markdown en ${WORKFLOWS_PATH} (ej: 'new-feature-name.md') describiendo los pasos técnicos.
       b. Reportar el enlace o nombre del workflow en Slack antes de proceder con la implementación.
    4. PRIVACIDAD: Trabaja solo dentro de ${subProjectPath} a menos que se requiera coordinación global.
    
    TAREA: ${prompt}
    
    [VALIDATION: After execution, verify with 'npm run build' or 'tsc' in the project folder.]
  `;

  const gemini = spawn('gemini', ['-y', '--prompt', finalPrompt], {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  let outputBuffer = '';
  let lastUpdateTs = Date.now();

  gemini.stdout.on('data', async (data) => {
    outputBuffer += data.toString();
    if (Date.now() - lastUpdateTs > 7000) {
      await say({
        text: `⏳ *Ejecutando Plan...*\n\`\`\`${outputBuffer.slice(-250)}\`\`\``,
        thread_ts: threadTs
      });
      lastUpdateTs = Date.now();
    }
  });

  gemini.on('close', async (code) => {
    if (code === 0) {
      await say({
        text: `✅ *Tarea Finalizada*\n\n*Resumen:* \n${outputBuffer.slice(-800)}`,
        thread_ts: threadTs
      });
    } else {
      await say({
        text: `❌ *Error en la ejecución* (Código: ${code}). Revisa los logs en la terminal.`,
        thread_ts: threadTs
      });
    }
  });
}

// Logic to map channel to private sub-projects
const getSubProjectByChannel = (channelId: string, text: string): string => {
  console.log('Channel ID:', channelId);
  console.log('Text:', text);
  const lowerText = text.toLowerCase();
  if (lowerText.includes('app') || lowerText.includes('frontend') || 'C0AK7379KM4' === channelId) return path.join(WORKSPACE_ROOT, 'lilfy-app');
  if (lowerText.includes('service') || lowerText.includes('backend') || 'C0AKN2FTVB3' === channelId) return path.join(WORKSPACE_ROOT, 'lilfy-service');
  if (lowerText.includes('mirror') || 'C0AKCNK08EQ' === channelId) return path.join(WORKSPACE_ROOT, 'lilfy-mirror');

  // Default mapping could be logic-based or hardcoded by Channel ID
  // For now, let's assume ROOT if not specified
  return WORKSPACE_ROOT;
};



app.event('app_mention', async ({ event, say }) => {
  console.log('Event:', event);
  const userText = event.text.replace(/<@.*?>/, '').trim();
  const threadTs = event.ts;
  const targetProject = getSubProjectByChannel(event.channel, userText);

  await say({
    text: `🛠️ *Lilfy Agent* activo para: \`${targetProject.split('/').pop()}\`\nEnfoque: _Workflow First_ + _Gemini Rules_`,
    thread_ts: threadTs
  });

  await executeAgentTask(userText, say, threadTs, targetProject);
});

(async () => {
  await app.start();
  console.log('⚡️ Lilfy Agent (Private Mode) is running!');
})();
