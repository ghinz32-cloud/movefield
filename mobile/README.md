# Movefield — native starter

Start with **[START-HERE.md](./START-HERE.md)** for step-by-step Windows + phone setup.

```sh
npm ci
npm run check
npm run test:engine
npm start
```

Local Expo Go demo. Native iOS/Android components; no backend, account sync, or compiled app binaries. Shared engine/catalog copies come from the Movefield website and can be refreshed with `npm run sync:shared -- <website-folder>`.

Revision 11 adds resumable plan setup, broader plan choices, repeatable coach/manual targets and clearer Saved/Undo controls to set logging, saved rest timers and optional local phone alerts. Open `START-HERE.md` for the first run, `docs/REVISION-11.md` for the audit and remaining launch work, and `docs/AI-COACHING.md` for the optional phone-model design. Real-device alarm testing and secure shared accounts are the next stage.
