module.exports = {
  apps: [
    {
      name: 'PPApp-st',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4200',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4200,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4200,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
