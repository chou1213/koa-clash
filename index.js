const Koa = require('koa');
const Router = require('koa-router');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = new Koa();
const router = new Router();

function generateRandomRoute() {
  return crypto.randomBytes(8).toString('hex');
}

function loadConfigRoutes() {
  const configDir = path.join(__dirname, 'config');
  const routeMap = new Map();
  
  if (!fs.existsSync(configDir)) {
    console.log('Config directory not found');
    return routeMap;
  }
  
  const files = fs.readdirSync(configDir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
  
  files.forEach(file => {
    const randomRoute = generateRandomRoute();
    const filePath = path.join(configDir, file);
    routeMap.set(randomRoute, filePath);
    
    console.log(`Mapped ${file} -> /${randomRoute}`);
    
    router.get(`/${randomRoute}`, async (ctx) => {
      try {
        if (!fs.existsSync(filePath)) {
          ctx.status = 404;
          ctx.body = { error: 'Configuration file not found' };
          return;
        }
        
        const configContent = fs.readFileSync(filePath, 'utf8');
        
        ctx.set('Content-Type', 'application/x-yaml');
        ctx.set('Content-Disposition', `attachment; filename=${randomRoute}.yaml`);
        ctx.body = configContent;
        
      } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
        console.error('Error serving config:', error);
      }
    });
  });
  
  return routeMap;
}

router.get('/clash', async (ctx) => {
  try {
    const configPath = path.join(__dirname, 'config.yml');
    
    if (!fs.existsSync(configPath)) {
      ctx.status = 404;
      ctx.body = { error: 'Configuration file not found' };
      return;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    ctx.set('Content-Type', 'application/x-yaml');
    ctx.set('Content-Disposition', 'attachment; filename=clash.yaml');

    // upload: 已上传流量（单位：Bytes）
    // download: 已下载流量（单位：Bytes）
    // total: 总流量限制（单位：Bytes）
    // expire: 过期时间（Unix 时间戳，秒），可选。
    // const upload = 5368709120;   // e.g., 5368709120 (5GB)
    // const download = 10737418240; // e.g., 10737418240 (10GB)
    // const total = 107374182400;     // e.g., 107374182400 (100GB)
    // const expire = 1678888888;      // Unix timestamp
    // const userInfoStr = `upload=${upload}; download=${download}; total=${total}; expire=${expire}`;
    // ctx.set('Subscription-Userinfo', userInfoStr);
    // ctx.set('profile-update-interval', '86400');

    ctx.body = configContent;
    
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
    console.error('Error serving Clash config:', error);
  }
});

router.get('/health', async (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

const routeMap = loadConfigRoutes();

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 7180;

app.listen(PORT, () => {
  console.log(`Clash subscription server running on port ${PORT}`);
  console.log(`Subscription URL: http://localhost:${PORT}/clash`);
  console.log('Random routes for config files:');
  routeMap.forEach((filePath, route) => {
    const fileName = path.basename(filePath);
    console.log(`  ${fileName} -> http://localhost:${PORT}/${route}`);
  });
});

module.exports = app;