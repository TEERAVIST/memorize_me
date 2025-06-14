import os from 'os'

const interfaces = os.networkInterfaces()
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`🌐 Access from LAN: http://${iface.address}:3000`)
    }
  }
}

