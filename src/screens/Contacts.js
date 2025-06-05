import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';

export default function ContactsScreen() {
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name || !emailOrPhone || !message) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Simulate form submission
    Alert.alert('Success', 'Your feedback has been submitted!', [
      {
        text: 'OK',
        onPress: () => {
          setName('');
          setEmailOrPhone('');
          setMessage('');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Heading */}
      <Text style={styles.heading}>CONTACT US</Text>

      {/* Contact Details */}
      <View style={styles.card}>
        <Text style={styles.contactText}>📧 Email: support@dedup.com</Text>
        <Text style={styles.contactText}>📞 Contact No: 253 3XXXX</Text>
      </View>

      {/* Feedback Form */}
      <View style={styles.card}>
        <Text style={styles.feedbackHeading}>FEEDBACK FORM</Text>

        {/* Name Input */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#777"
        />

        {/* Email/Phone Input */}
        <Text style={styles.label}>Email / Phone No</Text>
        <TextInput
          style={styles.input}
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          placeholder="Enter email or phone"
          placeholderTextColor="#777"
          keyboardType="email-address"
        />

        {/* Message Input */}
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageBox]}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter your message"
          placeholderTextColor="#777"
          multiline
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>© 2025 Dedup. All rights reserved.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff", // Clean white background
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222", // Dark gray text
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#f9f9f9", // Light gray card
    padding: 20,
    borderRadius: 12, // Soft rounded edges
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  contactText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 10,
  },
  feedbackHeading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#444",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#ffffff",
    color: "#222",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd", // Light border
    shadowColor: "#ddd",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBox: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007bff", // CCleaner-style blue button
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
});
