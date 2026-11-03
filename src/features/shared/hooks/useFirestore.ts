import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  Query,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../../services/firebase';

export function useFirestoreCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<() => void>(() => {});

  const fetchData = useCallback(() => {
    if (options.enabled === false) return;

    setLoading(true);
    setError(null);

    const db = getFirestoreDb();
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);

    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore listener error for ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );
  }, [collectionName, constraints, options.enabled]);

  useEffect(() => {
    fetchData();
    return () => unsubscribeRef.current();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

export function useFirestoreDoc<T extends DocumentData>(
  collectionName: string,
  docId: string | null,
  options: { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<() => void>(() => {});

  const fetchData = useCallback(() => {
    if (options.enabled === false || !docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const db = getFirestoreDb();
    const docRef = doc(db, collectionName, docId);

    unsubscribeRef.current = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore doc listener error for ${collectionName}/${docId}:`, err);
        setError(err);
        setLoading(false);
      }
    );
  }, [collectionName, docId, options.enabled]);

  useEffect(() => {
    fetchData();
    return () => unsubscribeRef.current();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useRealtimeQuery<T extends DocumentData>(
  queryBuilder: () => Query<DocumentData>,
  options: { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<() => void>(() => {});

  const fetchData = useCallback(() => {
    if (options.enabled === false) return;

    setLoading(true);
    setError(null);

    try {
      const q = queryBuilder();
      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
          setData(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Realtime query error:', err);
          setError(err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Query builder error:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [queryBuilder, options.enabled]);

  useEffect(() => {
    fetchData();
    return () => unsubscribeRef.current();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}