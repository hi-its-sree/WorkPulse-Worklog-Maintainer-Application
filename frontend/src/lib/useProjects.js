import { useEffect, useState } from 'react';
import api from './api.js';

// One shared project list for the whole app. Every screen that offers a project
// reads from here, and anything that changes the register broadcasts, so the
// planner, meetings, reports and the project page never drift apart.
let cache = null;
let inflight = null;
const listeners = new Set();

export const formatProjectLabel = (project) => {
  if (!project) return '';
  const code = project.projectNumber ? String(project.projectNumber).trim() : '';
  return code ? `${code} — ${project.name}` : project.name;
};

const broadcast = () => {
  listeners.forEach((listener) => listener(cache || []));
};

export const loadProjects = async ({ force = false } = {}) => {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = api.get('/projects')
    .then(({ data }) => {
      cache = Array.isArray(data) ? data : [];
      broadcast();
      return cache;
    })
    .catch((error) => {
      if (!cache) cache = [];
      broadcast();
      throw error;
    })
    .finally(() => { inflight = null; });

  return inflight;
};

// Call after creating, editing or deleting a project so open screens catch up.
export const refreshProjects = () => loadProjects({ force: true }).catch(() => cache || []);

export const useProjects = () => {
  const [projects, setProjects] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let active = true;
    const listener = (next) => { if (active) setProjects(next); };
    listeners.add(listener);

    loadProjects()
      .catch(() => [])
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return { projects, loading };
};
