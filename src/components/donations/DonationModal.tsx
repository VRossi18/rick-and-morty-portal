import clsx from 'clsx';
import { Suspense, lazy, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DonationDisclaimer } from './DonationDisclaimer';
import { FiatDonationPanel } from './FiatDonationPanel';

type DonationTab = 'crypto' | 'fiat';

const LazyCryptoDonationPanel = lazy(() =>
   import('./CryptoDonationPanel').then((module) => ({
      default: module.CryptoDonationPanel,
   })),
);

export interface DonationModalProps {
   open: boolean;
   onClose: () => void;
}

const dialogClassName =
   'fixed left-1/2 top-1/2 z-[60] m-0 max-h-[min(90vh,36rem)] w-[min(100%,28rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl backdrop:bg-black/55';

const tabButtonClass = (active: boolean) =>
   clsx(
      'flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition',
      active
         ? 'border-primary bg-primary/15 text-primary'
         : 'border-border text-muted-foreground hover:border-primary/40',
   );

function DonationModalContent({
   titleId,
   onClose,
}: {
   titleId: string;
   onClose: () => void;
}) {
   const { t } = useTranslation('common');
   const [tab, setTab] = useState<DonationTab>('crypto');

   return (
      <div className="space-y-5">
         <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-black tracking-tight">
               {t('donations.modalTitle')}
            </h2>
            <button
               type="button"
               onClick={onClose}
               className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
               aria-label={t('donations.close')}
            >
               {t('donations.close')}
            </button>
         </div>

         <DonationDisclaimer />

         <div className="flex gap-2" role="tablist" aria-label={t('donations.modalTitle')}>
            <button
               type="button"
               role="tab"
               aria-selected={tab === 'crypto'}
               className={tabButtonClass(tab === 'crypto')}
               onClick={() => setTab('crypto')}
            >
               {t('donations.tabCrypto')}
            </button>
            <button
               type="button"
               role="tab"
               aria-selected={tab === 'fiat'}
               className={tabButtonClass(tab === 'fiat')}
               onClick={() => setTab('fiat')}
            >
               {t('donations.tabFiat')}
            </button>
         </div>

         <div role="tabpanel">
            {tab === 'crypto' ? (
               <Suspense
                  fallback={
                     <p className="text-sm font-semibold text-primary">
                        {t('donations.crypto.panelLoading')}
                     </p>
                  }
               >
                  <LazyCryptoDonationPanel />
               </Suspense>
            ) : (
               <FiatDonationPanel />
            )}
         </div>
      </div>
   );
}

export function DonationModal({ open, onClose }: DonationModalProps) {
   const dialogRef = useRef<HTMLDialogElement>(null);
   const titleId = useId();

   useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) {
         return;
      }
      if (open && !dialog.open) {
         dialog.showModal();
      } else if (!open && dialog.open) {
         dialog.close();
      }
   }, [open]);

   useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) {
         return;
      }

      const handleClose = () => onClose();
      dialog.addEventListener('close', handleClose);
      dialog.addEventListener('cancel', handleClose);

      return () => {
         dialog.removeEventListener('close', handleClose);
         dialog.removeEventListener('cancel', handleClose);
      };
   }, [onClose]);

   return (
      <dialog
         ref={dialogRef}
         className={dialogClassName}
         aria-labelledby={titleId}
         onClose={onClose}
      >
         {open ? <DonationModalContent titleId={titleId} onClose={onClose} /> : null}
      </dialog>
   );
}
