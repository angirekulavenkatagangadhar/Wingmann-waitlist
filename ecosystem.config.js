module.exports = {
  apps: [
    {
      name: "wingmann-prod",
      script: "./server.js",
      
      instances: "max",       
      exec_mode: "cluster",   
      
      watch: false,
      max_memory_restart: "400M",
      env_file: ".env", 

      env: {
        NODE_ENV: "production",
        PORT: 3000
      },

      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
