import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Para web, usar CSS animations
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb) {
      // Para web, injetar CSS e usar timeouts
      const existingStyle = document.getElementById('splash-animations');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = 'splash-animations';
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        
        .splash-content {
          animation: fadeInUp 1.5s ease-out !important;
        }
        
        .splash-logo {
          animation: rotate 4s linear infinite, fadeInUp 1s ease-out !important;
        }
        
        .splash-progress {
          animation: progressFill 2s ease-out 0.5s forwards !important;
        }
        
        .splash-particle {
          animation: float 3s ease-in-out infinite, pulse 2s ease-in-out infinite !important;
        }
      `;
      document.head.appendChild(style);

      const timer = setTimeout(() => {
        onFinish();
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      // Para mobile, usar animações nativas
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      const logoAnimation = Animated.loop(
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );
      logoAnimation.start();

      setTimeout(() => {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }).start();
      }, 500);

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          logoAnimation.stop();
          onFinish();
        });
      }, 3500);

      return () => {
        clearTimeout(timer);
        logoAnimation.stop();
      };
    }
  }, [isWeb]);

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <LinearGradient
        colors={['#000000', '#001122', '#000000']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View
          style={[
            styles.content,
            isWeb ? [styles.webContent, { className: 'splash-content' }] : {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Logo animado */}
          <View
            style={[
              styles.logoContainer,
              isWeb ? [styles.webLogoContainer, { className: 'splash-logo' }] : {
                transform: [{ rotate: logoRotation }],
              },
            ]}
          >
            <View style={styles.logo}>
              <Text style={styles.logoText}>TF</Text>
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>TaskFlow</Text>
          <Text style={styles.subtitle}>Organize suas tarefas</Text>

          {/* Barra de progresso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  isWeb ? [styles.webProgressFill, { className: 'splash-progress' }] : { width: progressWidth },
                ]}
              />
            </View>
            <Text style={styles.progressText}>Carregando...</Text>
          </View>

          {/* Efeitos de partículas animadas */}
          <View style={styles.particles}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.particle,
                  isWeb ? {
                    ...styles.webParticle,
                    className: 'splash-particle',
                    animationDelay: `${i * 0.2}s, ${i * 0.3}s`,
                  } : {},
                  {
                    left: Math.random() * (width - 20),
                    top: Math.random() * (height - 200) + 100,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 0 : 0,
    paddingBottom: Platform.OS === 'web' ? 0 : 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 40,
    fontWeight: '400',
  },
  progressContainer: {
    width: 200,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#222222',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  particles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
    opacity: 0.8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  // Estilos específicos para web
  webContent: {
    opacity: 1,
    animation: 'fadeInUp 1.5s ease-out',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webLogoContainer: {
    animation: 'rotate 4s linear infinite, fadeInUp 1s ease-out',
  },
  webProgressFill: {
    width: '100%',
    animation: 'progressFill 2s ease-out 0.5s forwards',
  },
  webParticle: {
    animation: 'float 3s ease-in-out infinite, pulse 2s ease-in-out infinite',
    animationDelay: '0s, 0.5s',
  },
});

