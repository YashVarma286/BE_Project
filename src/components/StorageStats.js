import { NativeModules, Text, View, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import * as Progress from "react-native-progress";

const { StorageModule } = NativeModules;

// Helper function to convert bytes to GB
const formatGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2) + ' GB';

const StorageStats = () => {
    const [storageStats, setStorageStats] = useState(null);
    const [usedStorage, setUsedStorage] = useState(0);
    const [totalStorage, setTotalStorage] = useState(0);
    const [freeStorage, setFreeStorage] = useState(0); 
    const [hiddenCache, setHiddenCache] = useState(0.2);
    const [unneededFiles, setUnneededFiles] = useState(0.23);
    const [filesToReview, setFilesToReview] = useState(10.67);

    const calculatePercentage = (value) => value / totalStorage;

    useEffect(() => {
        const fetchStorageStats = async () => {
            try {
                const storageData = await StorageModule.getStorageStats();
                const stats = await JSON.parse(storageData);
                setStorageStats(stats);
                setUsedStorage((stats.usedStorage / 1e9).toFixed(2));
                setTotalStorage((stats.totalStorage / 1e9).toFixed(2));
                setFreeStorage((stats.freeStorage / 1e9).toFixed(2));
            } catch (error) {
                console.error('Error fetching storage stats:', error);
            }
        };
        fetchStorageStats();
    }, []);

    if (!storageStats) {
        return <Text>Loading storage stats...</Text>;
    }

    return (
        <View style={{ padding: 20 }}>
            <View style={styles.card}>
                {/* Storage Usage Heading */}
                <Text style={styles.heading}>Storage Overview</Text>

                {/* Free Space Text */}
                <Text style={styles.storageText}>{usedStorage} GB Used</Text>
                <Text style={styles.freeUpText}>
                    Available Storage <Text style={{ fontWeight: 'bold' }}>~{freeStorage} GB</Text>
                </Text>

                {/* Progress Bars */}
                <View style={styles.progressBarContainer}>
                    <Progress.Bar
                        progress={calculatePercentage(usedStorage)}
                        width={Dimensions.get("window").width - 60}
                        height={12}
                        color="#4CAF50" // Green for used storage
                        borderRadius={8}
                        borderWidth={1}
                        borderColor="#ddd"
                        unfilledColor="#e0e0e0"
                    />
                    <Progress.Bar
                        progress={calculatePercentage(hiddenCache)}
                        width={Dimensions.get("window").width - 60}
                        height={12}
                        color="#FFA500" // Orange for hidden cache
                        borderRadius={8}
                        borderWidth={1}
                        borderColor="transparent"
                        unfilledColor="transparent"
                        style={styles.overlayBar}
                    />
                    <Progress.Bar
                        progress={calculatePercentage(filesToReview)}
                        width={Dimensions.get("window").width - 60}
                        height={12}
                        color="#008000" // Dark Green for files to review
                        borderRadius={8}
                        borderWidth={1}
                        borderColor="transparent"
                        unfilledColor="transparent"
                        style={styles.overlayBar}
                    />
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.colorBox, { backgroundColor: "#FFA500" }]} />
                        <Text style={styles.legendText}>Hidden caches - {hiddenCache} GB</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.colorBox, { backgroundColor: "#008000" }]} />
                        <Text style={styles.legendText}>Documents - {(storageStats.documents / 1e9).toFixed(2)} GB</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.colorBox, { backgroundColor: "#0000FF" }]} />
                        <Text style={styles.legendText}>Images - {(storageStats.images / 1e9).toFixed(2)} GB</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.colorBox, { backgroundColor: "#FFA500" }]} />
                        <Text style={styles.legendText}>Videos - {(storageStats.videos / 1e9).toFixed(2)} GB</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.colorBox, { backgroundColor: "#008000" }]} />
                        <Text style={styles.legendText}>Audios - {(storageStats.audios / 1e9).toFixed(2)} GB</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.colorBox, { backgroundColor: "#0000FF" }]} />
                        <Text style={styles.legendText}>Unneeded Files - {unneededFiles} GB</Text>
                    </View>
                </View>
            </View>

            {/* <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Storage Statistics</Text> */}
            {/* <Text style={styles.statItem}>Total Storage: {formatGB(storageStats.totalStorage)}</Text>
        <Text style={styles.statItem}>Used Storage: {formatGB(storageStats.usedStorage)}</Text>
        <Text style={styles.statItem}>Available Storage: {formatGB(storageStats.availableStorage)}</Text>
        <Text style={styles.statItem}>System Storage: {formatGB(storageStats.systemStorage)}</Text>
        <Text style={styles.statItem}>Installed Apps Storage: {formatGB(storageStats.installedAppsStorage)}</Text>
        <Text style={styles.statItem}>App Data Storage: {formatGB(storageStats.appDataStorage)}</Text>

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>File Categories:</Text>
        <Text style={styles.statItem}>Images: {formatGB(storageStats.imagesSize)}</Text>
        <Text style={styles.statItem}>Videos: {formatGB(storageStats.videosSize)}</Text>
        <Text style={styles.statItem}>Audio: {formatGB(storageStats.audioSize)}</Text>
        <Text style={styles.statItem}>Documents: {formatGB(storageStats.documentsSize)}</Text>
        <Text style={styles.statItem}>APKs: {formatGB(storageStats.apkSize)}</Text> */}
            {/* <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Storage Stats</Text>
            {storageStats && (
                <>
                    <Text>Total Storage: {(storageStats.totalStorage / 1e9).toFixed(2)} GB</Text>
                    <Text>Used Storage: {(storageStats.usedStorage / 1e9).toFixed(2)} GB</Text>
                    <Text>Free Storage: {(storageStats.freeStorage / 1e9).toFixed(2)} GB</Text>
                    <Text>Images: {(storageStats.images / 1e6).toFixed(2)} MB</Text>
                    <Text>Videos: {(storageStats.videos / 1e6).toFixed(2)} MB</Text>
                    <Text>Audios: {(storageStats.audios / 1e6).toFixed(2)} MB</Text>
                    <Text>Documents: {(storageStats.documents / 1e6).toFixed(2)} MB</Text>
                    <Text>APKs: {(storageStats.apks / 1e6).toFixed(2)} MB</Text>
                </>
            )} */}
        </View>
    );
};

// Styles for better UI
const styles = {
    statItem: {
        fontSize: 18,
        marginVertical: 5,
    },
    /* Card Design */
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        paddingTop: 0,
        marginVertical: 15,
        width: Dimensions.get("window").width - 40,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8, // Enhanced shadow for a pop-up effect
    },

    /* Card Headings */
    heading: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },

    /* Storage Text */
    storageText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#444",
    },
    freeUpText: {
        fontSize: 16,
        color: "#666",
        marginBottom: 10,
    },

    /* Progress Bar */
    progressBarContainer: {
        marginVertical: 10,
    },
    overlayBar: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    heading: {
        fontSize: 24,
        color: '#202124', // Google's dark gray
        margin: 16,
        fontWeight: '500',
        elevation: 2, // Android shadow
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2,
    },
    /* Legend */
    legendContainer: {
        marginTop: 15,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    colorBox: {
        width: 15,
        height: 15,
        borderRadius: 3,
        marginRight: 10,
    },
    legendText: {
        fontSize: 14,
        color: "#555",
    },
};

export default StorageStats;