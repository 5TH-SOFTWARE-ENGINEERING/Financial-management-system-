import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
    const { colors } = useTheme();
    const { user, logout } = useAuthStore();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <View style={styles.profileHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {user?.full_name || 'User Name'}
                    </Text>
                    <Text style={[styles.email, { color: colors.muted }]}>
                        {user?.email || 'email@example.com'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={logout}
                >
                    <LogOut size={20} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center', // Center mainly for this simple view
    },
    content: {
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
