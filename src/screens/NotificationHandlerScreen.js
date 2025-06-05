import React, { useState } from 'react';
import { View, Modal, Text, Button } from 'react-native';

export default function NotificationHandlerScreen(fileData) {
  const [showModal, setShowModal] = useState(false);
  const [fileInfo, setFileInfo] = useState(fileData);

  return (
    <>
      {/* Your screen content */}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center' }}>
          <View style={{ margin: 20, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Duplicate File Found</Text>
            {fileInfo && (
              <>
                <Text>Name: {fileInfo.name}</Text>
                <Text>Path: {fileInfo.path}</Text>
                <Text>Size: {fileInfo.size}</Text>
                <Text>Similarity: {fileInfo.similarity}%</Text>
              </>
            )}
            <Button title="Close" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}
