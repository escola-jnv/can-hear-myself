# Como criar um driver

1. Crie `server/drivers/<modelo>/index.js`.
2. Exporte uma classe que estende `MixerDriver` (`server/drivers/driver.interface.js`).
3. Implemente: `connect()`, `disconnect()`, `setAuxSend(aux, channel, db)`, `setAuxMaster(aux, db)`, `muteAuxSend(aux, channel, muted)`.
4. Emita `"status"` com `{ connected: boolean }` ao conectar/desconectar.
5. Registre o modelo em `server/drivers/index.js`.
6. Teste usando o mesmo teste do mock em `tests/drivers/`.
