import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';

const execute = promisify(execFile);
const projectRoot = resolve(__dirname, '../..');
const cliPath = require.resolve('@angular/cli/bin/ng.js');

const server = new McpServer({ name: 'workshops-de-angular-mcp', version: '1.0.0' });

server.registerTool(
  'generate_component',
  {
    title: 'Generate Angular Component',
    description: 'Creates a new Angular component using the Angular CLI',
    inputSchema: {
      name: z.string().trim().min(1).describe('Component name'),
      path: z.string().optional().describe('Target path under src/app')
    }
  },
  async ({ name, path }) => {
    const targetPath = path?.replace(/\\/g, '/').replace(/^src\/app(?:\/|$)/, '');
    const target = targetPath ? `${targetPath}/${name}` : name;

    try {
      const result = await execute(
        process.execPath,
        [
          cliPath,
          'generate',
          'component',
          target,
          '--standalone',
          '--flat',
          '--skip-tests',
          '--inline-style',
          '--inline-template',
          '--no-interactive'
        ],
        { cwd: projectRoot, env: { ...process.env, NG_CLI_ANALYTICS: 'false' } }
      );
      return { content: [{ type: 'text', text: `✅ Component generated successfully:\n${result.stdout}` }] };
    } catch (error: unknown) {
      return {
        isError: true,
        content: [{ type: 'text', text: `❌ CLI Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
      };
    }
  }
);

// Keep stdout reserved for MCP protocol messages.
server
  .connect(new StdioServerTransport())
  .then(() => console.error('MCP server started'))
  .catch(error => {
    console.error('Error connecting to MCP server:', error);
    process.exitCode = 1;
  });
