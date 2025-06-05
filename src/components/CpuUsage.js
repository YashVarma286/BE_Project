import { Dimensions, NativeModules, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { LineChart } from 'react-native-chart-kit';

const { CpuModule } = NativeModules;
const screenWidth = Dimensions.get('window').width;

const CpuUsage = () => {
    const [cpuData, setCpuData] = useState(Array(10).fill(0));
    useEffect(() => {
      const interval = setInterval(async () => {
        const usage = await CpuModule.getCpuUsage();
        setCpuData((prevData) => [...prevData.slice(1), usage]);
      }, 2000);
      return () => clearInterval(interval);
    }, []);

    return (
        <View>
                <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>Real-Time CPU Usage</Text>
                <LineChart
                    data={{
                        labels: Array(cpuData.length).fill(''),
                        datasets: [{ data: cpuData, strokeWidth: 2 }],
                    }}
                    width={screenWidth}
                    height={220}
                    yAxisSuffix="%"
                    chartConfig={{
                        backgroundGradientFrom: "#f5f5f5",
                        backgroundGradientTo: "#f5f5f5",
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(0, 0, 200, ${opacity})`,
                    }}
                    bezier
                />
        </View>
    );
};

export default CpuUsage;
