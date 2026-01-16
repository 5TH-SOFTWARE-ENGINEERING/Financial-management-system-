import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { Type, FileText } from 'lucide-react-native';

export default function CreateProjectScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('INTERNAL'); // Default or dropdown

    const handleSubmit = async () => {
        if (!name) {
            Alert.alert('Error', 'Please fill in Project Name');
            return;
        }

        setLoading(true);
        try {
            await client.post('/projects/', {
                name,
                description,
                status: 'ACTIVE',
                project_type: type,
                // start_date: new Date().toISOString(),
            });

            router.back();
        } catch (error: any) {
            console.error('Create project error:', error);
            Alert.alert('Error', 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Project Name</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <FileText size={20} color={colors.muted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="e.g. Website Redesign"
                            placeholderTextColor={colors.muted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border, height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text, textAlignVertical: 'top' }]}
                            placeholder="Project details..."
                            placeholderTextColor={colors.muted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Create Project</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    button: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
