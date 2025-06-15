import React, { useEffect, useState } from 'react';
import { View, Modal, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function NotificationHandlerScreen({ route }) {
  const navigation = useNavigation();
  const { fileData } = route.params || {};
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (fileData) {
      setShowModal(true); // Show modal when fileData is available
    }
  }, [fileData]);

  const handleClose = () => {
    setShowModal(false);
    // Navigate to Home screen after modal closes
    navigation.navigate('Home');
  };

  return (
    <>
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center' }}>
          <View style={{ margin: 20, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Duplicate File Found</Text>
            {fileData ? (
              <>
                <Text>Name: {fileData.name}</Text>
                <Text>Path: {fileData.path}</Text>
                <Text>Size: {fileData.size}Kb</Text>
                <Text>Similarity: {fileData.similarity}%</Text>
              </>
            ) : (
              <Text>No file data available</Text>
            )}
            <Button title="Close" onPress={handleClose} />
          </View>
        </View>
      </Modal>
    </>
  );
}
