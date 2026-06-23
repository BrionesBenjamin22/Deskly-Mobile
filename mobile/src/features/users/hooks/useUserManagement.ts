import { useCallback, useEffect, useState } from 'react';

import { UserRole } from '../../auth/types/auth.types';
import { deactivateUser, listUsers, updateUserRole } from '../services/users.service';
import { ManagedUser } from '../types/managed-user.types';

export function useUserManagement(accessToken: string) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await listUsers(accessToken, page, search);
      setUsers(response.users);
      setTotalPages(Math.max(response.pagination.totalPages, 1));
    } catch (error) {
      setUsers([]);
      setErrorMessage(error instanceof Error ? error.message : null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, search]);

  useEffect(() => { void load(); }, [load]);

  const changeRole = async (userId: string, role: UserRole) => {
    await updateUserRole(accessToken, userId, role);
    await load();
  };

  const deactivate = async (userId: string) => {
    await deactivateUser(accessToken, userId);
    await load();
  };

  return {
    users,
    page,
    totalPages,
    isLoading,
    errorMessage,
    changeRole,
    deactivate,
    previousPage: () => setPage((current) => Math.max(current - 1, 1)),
    nextPage: () => setPage((current) => Math.min(current + 1, totalPages)),
    applySearch: (value: string) => {
      setPage(1);
      setSearch(value.trim());
    },
    refresh: load,
  };
}
