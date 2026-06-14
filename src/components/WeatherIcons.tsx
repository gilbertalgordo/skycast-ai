
import { motion } from "motion/react";
import { Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain, Snowflake, CloudLightning, Wind, Droplets, Thermometer, MapPin, Navigation, Sparkles, Eye, RefreshCw } from "lucide-react";

export const WeatherIcon = ({ name, className }: { name: string, className?: string }) => {
  const floatTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  };

  const spinTransition = {
    duration: 10,
    repeat: Infinity,
    ease: "linear"
  };

  const pulseTransition = {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  };

  switch (name) {
    case "Sun": 
      return (
        <motion.div animate={{ rotate: 360 }} transition={spinTransition} className={className}>
          <Sun className="w-full h-full" />
        </motion.div>
      );
    case "Cloud": 
      return (
        <motion.div 
          animate={{ y: [0, -5, 0], x: [0, 2, 0] }} 
          transition={floatTransition} 
          className={className}
        >
          <Cloud className="w-full h-full" />
        </motion.div>
      );
    case "CloudSun": 
      return (
        <motion.div 
          animate={{ y: [0, -4, 0] }} 
          transition={floatTransition} 
          className={className}
        >
          <CloudSun className="w-full h-full" />
        </motion.div>
      );
    case "CloudFog": 
      return (
        <motion.div 
          animate={{ opacity: [0.5, 0.8, 0.5], x: [-3, 3, -3] }} 
          transition={floatTransition} 
          className={className}
        >
          <CloudFog className="w-full h-full" />
        </motion.div>
      );
    case "CloudDrizzle": 
      return (
        <motion.div 
          animate={{ y: [0, 3, 0] }} 
          transition={pulseTransition} 
          className={className}
        >
          <CloudDrizzle className="w-full h-full" />
        </motion.div>
      );
    case "CloudRain": 
      return (
        <motion.div 
          animate={{ y: [0, 4, 0] }} 
          transition={pulseTransition} 
          className={className}
        >
          <CloudRain className="w-full h-full" />
        </motion.div>
      );
    case "Snowflake": 
      return (
        <motion.div 
          animate={{ rotate: 360, y: [0, 5, 0] }} 
          transition={spinTransition} 
          className={className}
        >
          <Snowflake className="w-full h-full" />
        </motion.div>
      );
    case "CloudLightning": 
      return (
        <motion.div 
          animate={{ scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }} 
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }} 
          className={className}
        >
          <CloudLightning className="w-full h-full" />
        </motion.div>
      );
    case "Wind": 
      return (
        <motion.div 
          animate={{ x: [-5, 5, -5] }} 
          transition={floatTransition} 
          className={className}
        >
          <Wind className="w-full h-full" />
        </motion.div>
      );
    case "Droplets": 
      return (
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={pulseTransition} 
          className={className}
        >
          <Droplets className="w-full h-full" />
        </motion.div>
      );
    case "Thermometer":
      return (
        <motion.div 
          animate={{ y: [0, -2, 0] }} 
          transition={pulseTransition} 
          className={className}
        >
          <Thermometer className="w-full h-full" />
        </motion.div>
      );
    case "MapPin":
      return (
        <motion.div 
          animate={{ scale: [1, 1.2, 1], y: [0, -2, 0] }} 
          transition={pulseTransition} 
          className={className}
        >
          <MapPin className="w-full h-full" />
        </motion.div>
      );
    case "Navigation":
      return (
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }} 
          transition={floatTransition} 
          className={className}
        >
          <Navigation className="w-full h-full" />
        </motion.div>
      );
    case "Sparkles":
      return (
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }} 
          transition={pulseTransition} 
          className={className}
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
      );
    case "Eye":
      return (
        <motion.div 
          animate={{ opacity: [0.7, 1, 0.7] }} 
          transition={pulseTransition} 
          className={className}
        >
          <Eye className="w-full h-full" />
        </motion.div>
      );
    case "RefreshCw":
      return (
        <div className={className}>
          <RefreshCw className="w-full h-full" />
        </div>
      );
    case "RefreshCw_loading":
      return (
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={className}
        >
          <RefreshCw className="w-full h-full" />
        </motion.div>
      );
    default: 
      return <Cloud className={className} />;
  }
};


