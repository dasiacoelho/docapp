import { useEffect, useState, useCallback, useRef } from 'react';
import { onSnapshot, Query, DocumentReference, DocumentSnapshot } from 'firebase/firestore';

export function useRealtimeListener<T>(
  subscribe: (onNext: (value: T) => void, onError: (error: Error) => void) => () => void,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<() => void>(() => {});

  const setupListener = useCallback(() => {
    setLoading(true);
    setError(null);

    unsubscribeRef.current = subscribe(
      (value) => {
        setData(value);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
  }, [subscribe]);

  useEffect(() => {
    setupListener();
    return () => unsubscribeRef.current();
  }, [setupListener, ...deps]);

  return { data, loading, error, refetch: setupListener };
}

export function useDocSnapshot<T>(docRef: DocumentReference | null) {
  return useRealtimeListener<T | null>(
    useCallback(
      (onNext, onError) => {
        if (!docRef) {
          onNext(null);
          return () => {};
        }
        return onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            onNext({ id: snap.id, ...snap.data() } as T);
          } else {
            onNext(null);
          }
        }, onError);
      },
      [docRef]
    ),
    [docRef]
  );
}

export function useQuerySnapshot<T>(query: Query | null) {
  return useRealtimeListener<T[]>(
    useCallback(
      (onNext, onError) => {
        if (!query) {
          onNext([]);
          return () => {};
        }
        return onSnapshot(query, (snap) => {
          const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
          onNext(docs);
        }, onError);
      },
      [query]
    ),
    [query]
  );
}

export function useDocumentData<T>(docSnap: DocumentSnapshot | null): T | null {
  if (!docSnap || !docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}