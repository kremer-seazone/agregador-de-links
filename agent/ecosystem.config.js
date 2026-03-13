module.exports = {
  apps: [
    {
      name: 'agregador-agent',
      script: 'agent.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx/esm',
      env_file: '.env',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
}
