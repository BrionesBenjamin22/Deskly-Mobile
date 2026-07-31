import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal } from '../../../components/ui/StatusModal';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { ProfileDetailRow } from '../components/ProfileDetailRow';
import { EditableProfileField } from '../components/EditableProfileField';
import { AuthServiceError, getCurrentUser, updateProfile } from '../services/auth.service';
import { AuthUser, CurrentUserResponse, UserRole } from '../types/auth.types';
import {
  validateProfileEmail,
  validateProfileUsername,
  validateProfileFullName,
  validateProfilePhone,
} from '../validation/auth.validation';
import { ProfilePenaltiesCard } from '../../penalties/components/ProfilePenaltiesCard';
import { useAuth } from '../context/AuthContext';

type ProfileScreenProps = {
  onPressDesks: () => void;
  onPressReservations: () => void;
  onPressPayments: () => void;
  onPressProfile: () => void;
  onPressLogout: () => void;
  onPressSwitchAccount: () => void;
  onPressUserManagement: () => void;
  onPressAdminCatalog: () => void;
  onPressChangePassword?: () => void;
  penaltiesRefreshKey?: number;
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  MIEMBRO: 'Miembro',
};

function getErrorMessage(error: unknown) {
  if (error instanceof AuthServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos recuperar su perfil. Intente nuevamente.';
}

export function ProfileScreen({
  onPressDesks,
  onPressReservations,
  onPressPayments,
  onPressProfile,
  onPressLogout,
  onPressSwitchAccount,
  onPressUserManagement,
  onPressAdminCatalog,
  onPressChangePassword,
  penaltiesRefreshKey = 0,
}: ProfileScreenProps) {
  const { accessToken, role: userRole, user: initialUser } = useAuth();
  const [user, setUser] = useState<AuthUser | CurrentUserResponse['user']>(
    initialUser,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser(accessToken)
      .then((response) => {
        if (isMounted) {
          setUser(response.user);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const handleUpdateProfile = async (
    field: 'email' | 'username' | 'fullName' | 'phone',
    value: string | number,
  ) => {
    setIsUpdating(true);
    try {
      const response = await updateProfile(accessToken, { [field]: value });
      setUser(response.user);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveSuccess = () => {
    setShowSuccessModal(true);
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.heading}>
            <View style={styles.avatar}>
              <AppText variant="title" color={colors.white}>
                {user.username.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.headingCopy}>
              <AppText variant="title" color={colors.primary}>
                Mi perfil
              </AppText>
              <AppText variant="body" color={colors.primaryLight}>
                Información asociada a su cuenta de Deskly.
              </AppText>
            </View>
          </View>

          <Card style={styles.card}>
            <AppText variant="subtitle" color={colors.primary}>
              Datos de la cuenta
            </AppText>
            {userRole === 'MIEMBRO' || userRole === 'GESTOR' ? (
              <>
                <EditableProfileField
                  label="Usuario"
                  value={user.username}
                  onSave={(value) => handleUpdateProfile('username', String(value))}
                  onSuccess={handleSaveSuccess}
                  validate={validateProfileUsername}
                  isLoading={isUpdating}
                />
                <EditableProfileField
                  label="Email"
                  value={user.email}
                  onSave={(value) => handleUpdateProfile('email', String(value))}
                  onSuccess={handleSaveSuccess}
                  keyboardType="email-address"
                  validate={validateProfileEmail}
                  isLoading={isUpdating}
                />
              </>
            ) : (
              <>
                <ProfileDetailRow label="Usuario" value={user.username} />
                <ProfileDetailRow label="Email" value={user.email} />
              </>
            )}
            <ProfileDetailRow label="Rol" value={roleLabels[user.role]} />
            <ProfileDetailRow
              label="Estado"
              value={user.active ? 'Activo' : 'Inactivo'}
            />
            {'blockedUntil' in user && user.blockedUntil && new Date(user.blockedUntil).getTime() > Date.now() ? (
              <View style={styles.blockedBanner}>
                <AppText variant="caption" color={statusColors.error} style={styles.blockedText}>
                  Cuenta bloqueada hasta el{' '}
                  {new Date(user.blockedUntil).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                  {' '}por acumulación de penalizaciones.
                </AppText>
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <AppText variant="subtitle" color={colors.primary}>
              Datos personales
            </AppText>
            {user.member ? (
              <>
                {userRole === 'MIEMBRO' || userRole === 'GESTOR' ? (
                  <EditableProfileField
                    label="Nombre y apellido"
                    value={user.member.fullName}
                    onSave={(value) => handleUpdateProfile('fullName', String(value))}
                    onSuccess={handleSaveSuccess}
                    validate={validateProfileFullName}
                    isLoading={isUpdating}
                  />
                ) : (
                  <ProfileDetailRow
                    label="Nombre y apellido"
                    value={user.member.fullName}
                  />
                )}
                <ProfileDetailRow
                  label="Estado del miembro"
                  value={user.member.active ? 'Activo' : 'Inactivo'}
                />
                {'dni' in user.member ? (
                  <>
                    <ProfileDetailRow
                      label="DNI"
                      value={String(user.member.dni)}
                    />
                    {userRole === 'MIEMBRO' || userRole === 'GESTOR' ? (
                      <EditableProfileField
                        label="Teléfono"
                        value={user.member.phone}
                        onSave={(value) => handleUpdateProfile('phone', Number(value))}
                        onSuccess={handleSaveSuccess}
                        keyboardType="phone-pad"
                        validate={validateProfilePhone}
                        isLoading={isUpdating}
                      />
                    ) : (
                      <ProfileDetailRow
                        label="Teléfono"
                        value={String(user.member.phone)}
                      />
                    )}
                  </>
                ) : null}
              </>
            ) : (
              <AppText variant="body" color={colors.primaryLight}>
                Esta cuenta administrativa no posee un miembro asociado.
              </AppText>
            )}
          </Card>

          {user.member ? (
            <ProfilePenaltiesCard refreshKey={penaltiesRefreshKey} />
          ) : null}
        </ScrollView>

        <BottomTabBar
          activeTab="profile"
          onPressDesks={onPressDesks}
          onPressReservations={onPressReservations}
          onPressPayments={onPressPayments}
          onPressProfile={onPressProfile}
          onPressLogout={onPressLogout}
          onPressSwitchAccount={onPressSwitchAccount}
          onPressUserManagement={onPressUserManagement}
          onPressAdminCatalog={onPressAdminCatalog}
          onPressChangePassword={onPressChangePassword}
        />
      </View>

      {errorMessage ? (
        <StatusModal
          visible
          type="error"
          title="No pudimos recuperar su perfil"
          description={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      ) : null}

      <StatusModal
        visible={showSuccessModal}
        type="success"
        title="Cambios guardados"
        description="Sus datos fueron actualizados correctamente."
        onClose={() => setShowSuccessModal(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    gap: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  card: {
    gap: spacing.xs,
  },
  blockedBanner: {
    backgroundColor: statusColors.errorSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  blockedText: {
    fontWeight: '600',
  },
});
