/** Profile photo picker for customers and providers (camera on native, file on web). */
import React, { useEffect, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { clearAvatar, saveAvatar } from '../lib/masterDb';
import { capturePhoto, isNativeApp } from '../lib/nativeCamera';
import { Button, Modal } from './ui';

export const AvatarModal: React.FC = () => {
  const { avatarOpen, closeAvatar, profile, refreshProfile, showToast } = useMaster();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (avatarOpen) { setFile(null); setPreview(null); }
  }, [avatarOpen]);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = async () => {
    const shot = await capturePhoto('avatar', 600);
    if (shot) setFile(shot);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await saveAvatar(file);
      await refreshProfile();
      showToast('প্রোফাইল ছবি আপডেট হয়েছে!', 'success');
      closeAvatar();
    } catch (e: any) {
      showToast(e?.message || 'ছবি আপলোড ব্যর্থ', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await clearAvatar();
      await refreshProfile();
      showToast('ছবি সরানো হয়েছে।', 'info');
      closeAvatar();
    } catch (e: any) {
      showToast(e?.message || 'ছবি সরানো ব্যর্থ', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={avatarOpen}
      onClose={closeAvatar}
      title="প্রোফাইল ছবি · Profile photo"
      description="গ্রাহক ও প্রোভাইডার — সবার জন্য একই ব্যবস্থা। ছবি অন্যান্য ব্যবহারকারীরা দেখতে পারেন।"
      size="sm"
    >
      <div className="flex flex-col items-center">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-orange-500/40 bg-zinc-800">
          {preview || profile?.avatar_url ? (
            <img src={preview || profile?.avatar_url || ''} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-orange-400">
              {profile?.full_name?.charAt(0).toUpperCase() || 'ন'}
            </span>
          )}
        </div>

        <div className="mt-5 w-full space-y-2">
          {isNativeApp ? (
            <Button variant="outline" fullWidth onClick={() => void pick()}>
              <Camera className="h-4 w-4" /> ক্যামেরা / গ্যালারি থেকে বেছে নিন
            </Button>
          ) : (
            <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 text-[13px] font-medium text-zinc-200 hover:bg-white/5">
              <ImageIcon className="h-4 w-4" /> ছবি ফাইল বেছে নিন
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          )}
          {file && <p className="text-center text-[11px] text-orange-300">{file.name}</p>}

          <Button fullWidth loading={busy} disabled={!file} onClick={() => void upload()}>
            ছবি সংরক্ষণ করুন · Save photo
          </Button>
          {profile?.avatar_url && (
            <Button variant="danger" fullWidth disabled={busy} onClick={() => void remove()}>
              <Trash2 className="h-4 w-4" /> বর্তমান ছবি সরান
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AvatarModal;
