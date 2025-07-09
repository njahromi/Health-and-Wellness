package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Shopify/sarama"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"
)

var (
	log = logrus.New()
	
	// Prometheus metrics
	healthEventsReceived = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "health_events_received_total",
			Help: "Total number of health events received",
		},
		[]string{"event_type", "source"},
	)
	
	healthEventsPublished = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "health_events_published_total",
			Help: "Total number of health events published to Kafka",
		},
		[]string{"topic", "event_type"},
	)
	
	healthEventsErrors = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "health_events_errors_total",
			Help: "Total number of errors processing health events",
		},
		[]string{"error_type"},
	)
	
	requestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint", "status"},
	)
)

// HealthEvent represents a health data event
type HealthEvent struct {
	ID          string                 `json:"id"`
	UserID      string                 `json:"user_id"`
	EventType   string                 `json:"event_type"`
	Category    string                 `json:"category"`
	Value       map[string]interface{} `json:"value"`
	Timestamp   time.Time              `json:"timestamp"`
	Source      string                 `json:"source"`
	DeviceID    string                 `json:"device_id,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
}

// Config holds application configuration
type Config struct {
	Server struct {
		Port int `mapstructure:"port"`
	} `mapstructure:"server"`
	
	Kafka struct {
		Brokers []string `mapstructure:"brokers"`
		Topics  struct {
			Activity   string `mapstructure:"activity"`
			HeartRate  string `mapstructure:"heart_rate"`
			Sleep      string `mapstructure:"sleep"`
			Nutrition  string `mapstructure:"nutrition"`
			Weight     string `mapstructure:"weight"`
			Mood       string `mapstructure:"mood"`
			Hydration  string `mapstructure:"hydration"`
			Meditation string `mapstructure:"meditation"`
		} `mapstructure:"topics"`
	} `mapstructure:"kafka"`
	
	Jaeger struct {
		Endpoint string `mapstructure:"endpoint"`
	} `mapstructure:"jaeger"`
}

var (
	config Config
	producer sarama.SyncProducer
	tracer   trace.Tracer
)

func init() {
	// Initialize Prometheus metrics
	prometheus.MustRegister(healthEventsReceived)
	prometheus.MustRegister(healthEventsPublished)
	prometheus.MustRegister(healthEventsErrors)
	prometheus.MustRegister(requestDuration)
	
	// Load configuration
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	
	// Set defaults
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("kafka.brokers", []string{"localhost:9092"})
	viper.SetDefault("kafka.topics.activity", "health.activity.raw")
	viper.SetDefault("kafka.topics.heart_rate", "health.heart_rate.raw")
	viper.SetDefault("kafka.topics.sleep", "health.sleep.raw")
	viper.SetDefault("kafka.topics.nutrition", "health.nutrition.raw")
	viper.SetDefault("kafka.topics.weight", "health.weight.raw")
	viper.SetDefault("kafka.topics.mood", "health.mood.raw")
	viper.SetDefault("kafka.topics.hydration", "health.hydration.raw")
	viper.SetDefault("kafka.topics.meditation", "health.meditation.raw")
	viper.SetDefault("jaeger.endpoint", "http://localhost:14268/api/traces")
	
	if err := viper.ReadInConfig(); err != nil {
		log.Warnf("Failed to read config file: %v", err)
	}
	
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Failed to unmarshal config: %v", err)
	}
	
	// Initialize Jaeger tracer
	if err := initTracer(); err != nil {
		log.Fatalf("Failed to initialize tracer: %v", err)
	}
	
	// Initialize Kafka producer
	if err := initKafkaProducer(); err != nil {
		log.Fatalf("Failed to initialize Kafka producer: %v", err)
	}
}

func initTracer() error {
	exporter, err := jaeger.New(jaeger.WithCollectorEndpoint(jaeger.WithEndpoint(config.Jaeger.Endpoint)))
	if err != nil {
		return err
	}
	
	res, err := resource.New(context.Background(),
		resource.WithAttributes(
			semconv.ServiceName("ingestion-service"),
			semconv.ServiceVersion("1.0.0"),
		),
	)
	if err != nil {
		return err
	}
	
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	
	otel.SetTracerProvider(tp)
	tracer = tp.Tracer("ingestion-service")
	
	return nil
}

func initKafkaProducer() error {
	kafkaConfig := sarama.NewConfig()
	kafkaConfig.Producer.Return.Successes = true
	kafkaConfig.Producer.RequiredAcks = sarama.WaitForAll
	kafkaConfig.Producer.Retry.Max = 5
	
	var err error
	producer, err = sarama.NewSyncProducer(config.Kafka.Brokers, kafkaConfig)
	if err != nil {
		return err
	}
	
	log.Info("Kafka producer initialized successfully")
	return nil
}

func getTopicForCategory(category string) string {
	switch category {
	case "activity":
		return config.Kafka.Topics.Activity
	case "heart_rate":
		return config.Kafka.Topics.HeartRate
	case "sleep":
		return config.Kafka.Topics.Sleep
	case "nutrition":
		return config.Kafka.Topics.Nutrition
	case "weight":
		return config.Kafka.Topics.Weight
	case "mood":
		return config.Kafka.Topics.Mood
	case "hydration":
		return config.Kafka.Topics.Hydration
	case "meditation":
		return config.Kafka.Topics.Meditation
	default:
		return "health.unknown.raw"
	}
}

func publishHealthEvent(ctx context.Context, event HealthEvent) error {
	span := trace.SpanFromContext(ctx)
	defer span.End()
	
	// Increment received events metric
	healthEventsReceived.WithLabelValues(event.EventType, event.Source).Inc()
	
	// Prepare event for Kafka
	event.ID = uuid.New().String()
	event.CreatedAt = time.Now()
	
	eventJSON, err := json.Marshal(event)
	if err != nil {
		healthEventsErrors.WithLabelValues("json_marshal").Inc()
		return fmt.Errorf("failed to marshal event: %w", err)
	}
	
	// Determine Kafka topic
	topic := getTopicForCategory(event.Category)
	
	// Create Kafka message
	message := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.StringEncoder(event.UserID),
		Value: sarama.ByteEncoder(eventJSON),
		Headers: []sarama.RecordHeader{
			{Key: []byte("event_type"), Value: []byte(event.EventType)},
			{Key: []byte("category"), Value: []byte(event.Category)},
			{Key: []byte("source"), Value: []byte(event.Source)},
			{Key: []byte("timestamp"), Value: []byte(event.Timestamp.Format(time.RFC3339))},
		},
	}
	
	// Publish to Kafka
	partition, offset, err := producer.SendMessage(message)
	if err != nil {
		healthEventsErrors.WithLabelValues("kafka_publish").Inc()
		return fmt.Errorf("failed to publish to Kafka: %w", err)
	}
	
	// Increment published events metric
	healthEventsPublished.WithLabelValues(topic, event.EventType).Inc()
	
	log.WithFields(logrus.Fields{
		"event_id":  event.ID,
		"user_id":   event.UserID,
		"event_type": event.EventType,
		"category":  event.Category,
		"topic":     topic,
		"partition": partition,
		"offset":    offset,
	}).Info("Health event published to Kafka")
	
	return nil
}

func healthEventHandler(c *gin.Context) {
	start := time.Now()
	
	ctx, span := tracer.Start(c.Request.Context(), "health_event_handler")
	defer span.End()
	
	var event HealthEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		healthEventsErrors.WithLabelValues("invalid_json").Inc()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload"})
		return
	}
	
	// Validate required fields
	if event.UserID == "" || event.EventType == "" || event.Category == "" {
		healthEventsErrors.WithLabelValues("missing_fields").Inc()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}
	
	// Set timestamp if not provided
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}
	
	// Publish event to Kafka
	if err := publishHealthEvent(ctx, event); err != nil {
		log.WithError(err).Error("Failed to publish health event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process event"})
		return
	}
	
	// Record request duration
	duration := time.Since(start).Seconds()
	requestDuration.WithLabelValues("POST", "/health/event", "200").Observe(duration)
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Health event processed successfully",
		"event_id": event.ID,
	})
}

func healthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"service": "ingestion-service",
		"timestamp": time.Now().UTC(),
	})
}

func metricsHandler(c *gin.Context) {
	promhttp.Handler().ServeHTTP(c.Writer, c.Request)
}

func setupRouter() *gin.Engine {
	router := gin.Default()
	
	// Add middleware for request duration tracking
	router.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start).Seconds()
		requestDuration.WithLabelValues(c.Request.Method, c.FullPath(), fmt.Sprintf("%d", c.Writer.Status())).Observe(duration)
	})
	
	// Health check endpoint
	router.GET("/health", healthCheckHandler)
	
	// Metrics endpoint for Prometheus
	router.GET("/metrics", metricsHandler)
	
	// Health event ingestion endpoint
	router.POST("/health/event", healthEventHandler)
	
	// Batch health events endpoint
	router.POST("/health/events/batch", func(c *gin.Context) {
		var events []HealthEvent
		if err := c.ShouldBindJSON(&events); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload"})
			return
		}
		
		results := make([]map[string]interface{}, 0, len(events))
		for _, event := range events {
			if err := publishHealthEvent(c.Request.Context(), event); err != nil {
				results = append(results, map[string]interface{}{
					"event_id": event.ID,
					"error":    err.Error(),
				})
			} else {
				results = append(results, map[string]interface{}{
					"event_id": event.ID,
					"status":   "success",
				})
			}
		}
		
		c.JSON(http.StatusOK, gin.H{"results": results})
	})
	
	return router
}

func main() {
	// Setup graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	
	// Setup router
	router := setupRouter()
	
	// Start server
	go func() {
		addr := fmt.Sprintf(":%d", config.Server.Port)
		log.Infof("Starting ingestion service on %s", addr)
		if err := router.Run(addr); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()
	
	// Wait for shutdown signal
	<-quit
	log.Info("Shutting down ingestion service...")
	
	// Cleanup
	if producer != nil {
		producer.Close()
	}
	
	log.Info("Ingestion service stopped")
} 