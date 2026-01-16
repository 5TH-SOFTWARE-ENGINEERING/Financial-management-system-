import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ArrowRight, Shield, TrendingUp, Zap } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Hero Section */}
            <Animated.View
                style={[
                    styles.heroContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                <Image
                    source={require('@/assets/images/landing_hero.png')}
                    style={styles.heroImage}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Content Section */}
            <Animated.View
                style={[
                    styles.contentContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Master Your <Text style={{ color: colors.primary }}>Wealth</Text>
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
                        Professional finance and project management at your fingertips.
                    </Text>
                </View>

                {/* Features Row */}
                <View style={styles.featuresRow}>
                    <View style={styles.featureItem}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                            <TrendingUp size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.featureText, { color: colors.text }]}>Analytics</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.iconBox, { backgroundColor: '#8b5cf6' + '15' }]}>
                            <Zap size={20} color="#8b5cf6" />
                        </View>
                        <Text style={[styles.featureText, { color: colors.text }]}>Fast</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.iconBox, { backgroundColor: '#10b981' + '15' }]}>
                            <Shield size={20} color="#10b981" />
                        </View>
                        <Text style={[styles.featureText, { color: colors.text }]}>Secure</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                        <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: colors.border }]}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                            Already have an account? <Text style={{ fontWeight: '700', color: colors.primary }}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    heroContainer: {
        height: height * 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    heroImage: {
        width: width * 0.85,
        height: width * 0.85,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'flex-start',
    },
    titleContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        lineHeight: 50,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '400',
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 50,
    },
    featureItem: {
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.8,
    },
    actions: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryButton: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 15,
    },
});
