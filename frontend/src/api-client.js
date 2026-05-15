
/**
 * Hubify API Client
 * Centralized communication layer for Hubify platform backend.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

// Database core functions
export const getDatabase = () => ({});

export const getCollectionPath = (db, ...paths) => {
  return paths.join('/');
};

export const getDocumentPath = (db, ...paths) => {
  return paths.join('/');
};

/**
 * Real-time listener for collection changes
 */
export const listenToCollection = (path, callback) => {
  let interval;
  let lastHash = '';
  
  const fetchPath = async () => {
    try {
      let url = '';
      const isUser = path.includes('users');
      
      if (isUser) url = `${API_URL}/auth/users`;
      else if (path.includes('messages')) url = `${API_URL}/data/messages`;
      else if (path.includes('groups')) url = `${API_URL}/data/groups`;
      else if (path.includes('meetings')) url = `${API_URL}/data/meetings`;
      else if (path.includes('calls')) url = `${API_URL}/data/calls`;
      else if (path.includes('invites')) url = `${API_URL}/data/invites`;

      if (!url) return;

      const res = await fetch(`${url}?t=${Date.now()}`);
      if (res.ok) {
        const text = await res.text();
        if (text === lastHash) return;
        lastHash = text;

        const data = JSON.parse(text);
        let mappedDocs = [];
        
        if (isUser) {
          mappedDocs = data.map(d => ({
            id: d.id,
            ...d,
            data: () => ({ 
              id: d.id,
              username: d.username,
              email: d.email,
              displayName: d.displayName,
              name: d.displayName || d.username, 
              role: d.role, 
              isOnline: d.online, 
              avatarUrl: d.avatarUrl, 
              bio: d.bio,
              status: d.status || (d.online ? 'online' : 'offline'),
              readTimestamps: d.readTimestamps,
              activeDMs: d.activeDMs
            })
          }));
        } else {
          mappedDocs = data.map(d => {
            const parsed = JSON.parse(d.jsonData);
            return {
              id: parsed.id || d.id,
              data: () => parsed
            };
          });
        }
        
        callback({ docs: mappedDocs });
      }
    } catch (e) {}
  };

  fetchPath();
  interval = setInterval(fetchPath, 2000);
  
  return () => clearInterval(interval);
};

/**
 * Create a new document in a collection
 */
export const createDocument = async (path, data) => {
  let url = '';
  if (path.includes('messages')) url = `${API_URL}/data/messages`;
  else if (path.includes('meetings')) url = `${API_URL}/data/meetings`;
  else if (path.includes('calls')) url = `${API_URL}/data/calls`;
  else if (path.includes('groups')) url = `${API_URL}/data/groups`;
  else if (path.includes('invites')) url = `${API_URL}/data/invites`;

  if (url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (err) {
      console.error('API Error (createDocument):', err);
    }
  }
};

const mergeDocumentData = async (collectionName, docId, data) => {
  try {
    const response = await fetch(`${API_URL}/data/${collectionName}?t=${Date.now()}`);
    if (!response.ok) return { id: docId, ...data };

    const docs = await response.json();
    const existingDoc = docs.find(d => {
      try {
        const existingData = JSON.parse(d.jsonData);
        return existingData.id === docId;
      } catch (e) {
        return false;
      }
    });

    if (!existingDoc) return { id: docId, ...data };

    const existingData = JSON.parse(existingDoc.jsonData);
    return { ...existingData, ...data, id: docId };
  } catch (err) {
    return { id: docId, ...data };
  }
};

/**
 * Save or merge a document
 */
export const saveDocument = async (path, data, options = {}) => {
  const shouldMerge = Boolean(options?.merge);
  let url = '';
  if (path.includes('users')) {
    const userId = path.split('/').pop();
    url = `${API_URL}/auth/users/${userId}`;
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        return null;
      }
      
      return await response.json();
    } catch (err) {
      console.error('API Error (saveDocument users):', err);
      return null;
    }
  } else {
    const parts = path.split('/');
    const docId = parts.pop();
    const collectionName = parts.pop();
    url = `${API_URL}/data/${collectionName}`;

    try {
      const payload = shouldMerge ? await mergeDocumentData(collectionName, docId, data) : { id: docId, ...data };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      console.error(`API Error (saveDocument ${collectionName}):`, err);
      return null;
    }
  }
};

export const patchDocument = async (path, data) => {
  return saveDocument(path, data, { merge: true });
};

/**
 * Fetch a full collection
 */
export const fetchCollection = async (path) => {
  try {
    let collectionName = '';
    if (path.includes('calls')) collectionName = 'calls';
    else if (path.includes('users')) collectionName = 'users';
    else if (path.includes('groups')) collectionName = 'groups';
    else if (path.includes('messages')) collectionName = 'messages';
    else if (path.includes('invites')) collectionName = 'invites';
    
    if (!collectionName) return { docs: [] };

    let url = collectionName === 'users' ? `${API_URL}/auth/users` : `${API_URL}/data/${collectionName}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const mappedDocs = data.map(d => ({
        id: collectionName === 'users' ? d.id : (JSON.parse(d.jsonData).id || d.id),
        data: () => collectionName === 'users' ? d : JSON.parse(d.jsonData)
      }));
      return { docs: mappedDocs };
    }
  } catch (e) {
    console.error('API Error (fetchCollection):', e);
  }
  return { docs: [] };
};

/**
 * Delete a document
 */
export const removeDocument = async (path) => {
  const parts = String(path).split('/');
  const id = parts.pop();
  const collectionName = parts.pop();
  
  if (collectionName && id) {
    try {
      const url = `${API_URL}/data/${collectionName}/${id}`;
      return await fetch(url, { method: 'DELETE' });
    } catch (err) {
      console.error('API Error (removeDocument):', err);
    }
  }
};

// Legacy auth stubs (handled externally)
export const initializeApp = () => ({});
export const getAuth = () => ({});
export const onAuthStateChanged = (auth, callback) => (() => {});
export const signInAnonymously = async () => {};
export const signInWithCustomToken = async () => {};
