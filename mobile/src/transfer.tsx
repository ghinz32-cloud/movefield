import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNativeAppearance } from './appearance';
import { isTransferFile, passwordProblem, TRANSFER_MIN_PASSWORD } from './shared/transfer-bundle';

// Password-protected transfer files for moving to a new phone. The password is never stored on the phone.
function useStyles() {
  const { p, colors: c, fonts } = useNativeAppearance();
  const text = { color: c.ink, fontSize: 16 * p.textSize / 100, lineHeight: 24 * p.textSize / 100, fontFamily: fonts ? 'Inter' : undefined };
  const input = { minHeight: 48, padding: 12, borderWidth: 1, borderColor: c.line, borderRadius: 10, color: c.ink, backgroundColor: c.white, fontSize: 16 * p.textSize / 100 };
  const button = (filled: boolean, disabled: boolean) => ({ minHeight: 48, padding: 12, borderRadius: 10, borderWidth: filled ? 0 : 2, borderColor: c.green, backgroundColor: filled ? c.green : 'transparent', alignItems: 'center' as const, justifyContent: 'center' as const, opacity: disabled ? 0.5 : 1 });
  const buttonText = (filled: boolean) => ({ ...text, color: filled ? c.onAccent : c.green, fontWeight: '700' as const });
  return { c, text, input, button, buttonText };
}

export function NativeTransferMake({ onMake }: { onMake: (password: string) => Promise<string> }) {
  const { text, input, button, buttonText } = useStyles();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const submit = async () => {
    if (password !== again) { setError('The two passwords do not match.'); return; }
    const problem = passwordProblem(password);
    if (problem) { setError(problem.message); return; }
    setBusy(true); setError(''); setDone(false);
    const result = await onMake(password);
    setBusy(false);
    if (result) { setError(result); return; }
    setPassword(''); setAgain(''); setDone(true);
  };
  return <View style={{ gap: 10 }}>
    <Text style={text}>Make a transfer file for your new phone. It is encrypted with a password you choose, at least {TRANSFER_MIN_PASSWORD} characters. Anyone with the file and the password can read your training, so keep both private. If the password is lost, the file cannot be opened, and nobody can reset it.</Text>
    <TextInput accessibilityLabel="New transfer password" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} style={input} placeholder="Password" placeholderTextColor="#8a968e" />
    <TextInput accessibilityLabel="Type the transfer password again" secureTextEntry autoComplete="new-password" value={again} onChangeText={setAgain} style={input} placeholder="Type it again" placeholderTextColor="#8a968e" />
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !password || !again }} disabled={busy || !password || !again} onPress={() => void submit()} style={button(true, busy || !password || !again)}>
      <Text style={buttonText(true)}>{busy ? 'Protecting the file…' : 'Make transfer file'}</Text>
    </Pressable>
    {!!error && <Text accessibilityRole="alert" style={text}>{error}</Text>}
    {done && <Text accessibilityLiveRegion="polite" style={text}>Shared. Save the file to Files or email it to yourself. On your new phone, open Movefield, choose Restore, paste the file and enter this password.</Text>}
  </View>;
}

export function NativeTransferOpen({ onOpen, busyLabel }: { onOpen: (raw: string, password: string) => Promise<string>; busyLabel?: string }) {
  const { text, input, button, buttonText } = useStyles();
  const [raw, setRaw] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const transfer = useMemo(() => raw.trim() !== '' && isTransferFile(raw.trim()), [raw]);
  const ready = raw.trim() !== '' && (!transfer || password !== '') && !busy;
  const open = async () => {
    setBusy(true); setError('');
    const result = await onOpen(raw.trim(), password);
    setBusy(false);
    if (result) { setError(result); return; }
    setRaw(''); setPassword('');
  };
  return <View style={{ gap: 10 }}>
    <Text style={text}>Paste the transfer file here, or a plain backup. Nothing is replaced until the file opens and you confirm.</Text>
    <TextInput accessibilityLabel="Paste transfer file or backup" multiline value={raw} onChangeText={setRaw} style={{ ...input, minHeight: 120, textAlignVertical: 'top' }} />
    {transfer && <TextInput accessibilityLabel="Password for this transfer file" secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} style={input} placeholder="Password for this file" placeholderTextColor="#8a968e" />}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={() => void open()} style={button(true, !ready)}>
      <Text style={buttonText(true)}>{busy ? (busyLabel ?? 'Opening…') : transfer ? 'Open transfer file' : 'Open backup'}</Text>
    </Pressable>
    {!!error && <Text accessibilityRole="alert" style={text}>{error}</Text>}
  </View>;
}
