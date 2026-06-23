import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { ProfileDetailRow } from '../components/ProfileDetailRow';
import { AuthServiceError, getCurrentUser } from '../services/auth.service';
import { AuthUser, CurrentUserResponse, UserRole } from '../types/auth.types';
import { ProfilePenaltiesCard } from '../../penalties/components/ProfilePenaltiesCard';

type ProfileScreenProps = {
  accessToken: string;
  initialUser: AuthUser;
  userRole: UserRole;
  onPressDesks: () => void;
  onPressReservations: () => void;
  onPressPayments: () => void;
  onPressProfile: () => void;
  onPressLogout: () => void;
  onPressSwitchAccount: () => void;
  onPressUserManagement: () => void;
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
  accessToken,
  initialUser,
  userRole,
  onPressDesks,
  onPressReservations,
  onPressPayments,
  onPressProfile,
  onPressLogout,
  onPressSwitchAccount,
  onPressUserManagement,
  penaltiesRefreshKey = 0,
}: ProfileScreenProps) {
  const [user, setUser] = useState<AuthUser | CurrentUserResponse['user']>(
    initialUser,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            <ProfileDetailRow label="Usuario" value={user.username} />
            <ProfileDetailRow label="Email" value={user.email} />
            <ProfileDetailRow label="Rol" value={roleLabels[user.role]} />
            <ProfileDetailRow
              label="Estado"
              value={user.active ? 'Activo' : 'Inactivo'}
            />
          </Card>

          <Card style={styles.card}>
            <AppText variant="subtitle" color={colors.primary}>
              Datos personales
            </AppText>
            {user.member ? (
              <>
                <ProfileDetailRow
                  label="Nombre y apellido"
                  value={user.member.fullName}
                />
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
                    <ProfileDetailRow
                      label="Teléfono"
                      value={String(user.member.phone)}
                    />
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
            <ProfilePenaltiesCard
              accessToken={accessToken}
              refreshKey={penaltiesRefreshKey}
            />
          ) : null}
        </ScrollView>

        <BottomTabBar
          activeTab="profile"
          userRole={userRole}
          onPressDesks={onPressDesks}
          onPressReservations={onPressReservations}
          onPressPayments={onPressPayments}
          onPressProfile={onPressProfile}
          onPressLogout={onPressLogout}
          onPressSwitchAccount={onPressSwitchAccount}
          onPressUserManagement={onPressUserManagement}
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
});
