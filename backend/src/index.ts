import dns from 'dns';
import app from './app';
import { env } from './utils/env';

// Fix for Node.js native fetch failing with Neon on machines without IPv6
dns.setDefaultResultOrder('ipv4first');

const port = env.port;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
