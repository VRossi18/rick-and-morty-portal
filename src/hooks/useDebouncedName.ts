import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 380;

export function useDebouncedName(options?: {
   delayMs?: number;
   onApply?: () => void;
}) {
   const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
   const onApplyRef = useRef(options?.onApply);

   useEffect(() => {
      onApplyRef.current = options?.onApply;
   }, [options?.onApply]);

   const [nameDraft, setNameDraft] = useState('');
   const [appliedName, setAppliedName] = useState('');
   const skipApplyRef = useRef(true);

   useEffect(() => {
      const id = window.setTimeout(() => {
         const next = nameDraft.trim();
         startTransition(() => {
            setAppliedName((current) => (current === next ? current : next));
         });
      }, delayMs);

      return () => window.clearTimeout(id);
   }, [nameDraft, delayMs]);

   useEffect(() => {
      if (skipApplyRef.current) {
         skipApplyRef.current = false;
         return;
      }
      onApplyRef.current?.();
   }, [appliedName]);

   const resetName = useCallback(() => {
      skipApplyRef.current = true;
      setNameDraft('');
      setAppliedName('');
   }, []);

   return {
      nameDraft,
      setNameDraft,
      appliedName,
      resetName,
   };
}
