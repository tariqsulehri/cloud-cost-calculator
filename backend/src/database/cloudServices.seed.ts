import type { SeedService } from './CloudCatalogDatabase.js';

// Generated from Cloud_Services_Mapping.xlsx by scripts/generate_cloud_service_seed.py.
export const cloudServiceSeeds: SeedService[] = [
  {
    "serviceKey": "ai-machine-learning.ai-bot-service",
    "componentType": "unknown",
    "sourceCategory": "AI + Machine Learning",
    "mappingStatus": "mapped",
    "aliases": [
      "AI + Machine Learning",
      "AI Bot Service",
      "Amazon Lex / Amazon Connect",
      "Connect",
      "Dialogflow CX",
      "Dialogflow CX / Vertex AI Agents",
      "Lex",
      "Vertex AI Agents"
    ],
    "providers": {
      "azure": {
        "canonicalName": "AI Bot Service",
        "providerNamespace": "Microsoft.CognitiveServices",
        "pricingServiceName": "AI Bot Service",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Lex / Amazon Connect",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Lex",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Dialogflow CX / Vertex AI Agents",
        "providerNamespace": null,
        "pricingServiceName": "Dialogflow CX",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "ai-machine-learning.azure-ai-search",
    "componentType": "unknown",
    "sourceCategory": "AI + Machine Learning",
    "mappingStatus": "mapped",
    "aliases": [
      "AI + Machine Learning",
      "AI Search",
      "Amazon OpenSearch Service / Kendra",
      "Azure AI Search",
      "Kendra",
      "OpenSearch Service",
      "Vertex AI Search"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure AI Search",
        "providerNamespace": "Microsoft.CognitiveServices",
        "pricingServiceName": "AI Search",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon OpenSearch Service / Kendra",
        "providerNamespace": null,
        "pricingServiceName": "Amazon OpenSearch Service",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Vertex AI Search",
        "providerNamespace": null,
        "pricingServiceName": "Vertex AI Search",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "ai-machine-learning.azure-ai-services",
    "componentType": "unknown",
    "sourceCategory": "AI + Machine Learning",
    "mappingStatus": "mapped",
    "aliases": [
      "AI + Machine Learning",
      "AI APIs",
      "AI Services",
      "Amazon AI Services (Rekognition, Comprehend, Polly, Translate...)",
      "Azure AI Services",
      "Google AI APIs (Vision AI, NLP, Translation...)"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure AI Services",
        "providerNamespace": "Microsoft.CognitiveServices",
        "pricingServiceName": "AI Services",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon AI Services (Rekognition, Comprehend, Polly, Translate...)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon AI Services (Rekognition, Comprehend, Polly, Translate...)",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google AI APIs (Vision AI, NLP, Translation...)",
        "providerNamespace": null,
        "pricingServiceName": "Google AI APIs (Vision AI, NLP, Translation...)",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "ai-machine-learning.azure-machine-learning",
    "componentType": "unknown",
    "sourceCategory": "AI + Machine Learning",
    "mappingStatus": "mapped",
    "aliases": [
      "AI + Machine Learning",
      "Amazon SageMaker",
      "Azure Machine Learning",
      "Machine Learning",
      "SageMaker",
      "Vertex AI"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Machine Learning",
        "providerNamespace": "Microsoft.CognitiveServices",
        "pricingServiceName": "Machine Learning",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon SageMaker",
        "providerNamespace": null,
        "pricingServiceName": "Amazon SageMaker",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Vertex AI",
        "providerNamespace": null,
        "pricingServiceName": "Vertex AI",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "ai-machine-learning.microsoft-foundry-ai-studio",
    "componentType": "unknown",
    "sourceCategory": "AI + Machine Learning",
    "mappingStatus": "mapped",
    "aliases": [
      "AI + Machine Learning",
      "Amazon Bedrock",
      "Bedrock",
      "Microsoft Foundry",
      "Microsoft Foundry (AI Studio)",
      "Vertex AI Model Garden"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Microsoft Foundry (AI Studio)",
        "providerNamespace": "Microsoft.CognitiveServices",
        "pricingServiceName": "Foundry (AI Studio)",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Bedrock",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Bedrock",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Vertex AI Model Garden",
        "providerNamespace": null,
        "pricingServiceName": "Vertex AI Model Garden",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "ai-machine-learning.open-datasets",
    "componentType": "unknown",
    "sourceCategory": "AI + Machine Learning",
    "mappingStatus": "mapped",
    "aliases": [
      "AI + Machine Learning",
      "AWS Open Data Program",
      "AWS Open Data Program / Registry",
      "Cloud Public Datasets",
      "Google Cloud Public Datasets",
      "Open Datasets",
      "Registry"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Open Datasets",
        "providerNamespace": "Microsoft.CognitiveServices",
        "pricingServiceName": "Open Datasets",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Open Data Program / Registry",
        "providerNamespace": null,
        "pricingServiceName": "AWS Open Data Program",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Cloud Public Datasets",
        "providerNamespace": null,
        "pricingServiceName": "Google Cloud Public Datasets",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "ai-machine-learning.planetary-computer",
    "componentType": "unknown",
    "sourceCategory": "AI + Machine Learning",
    "mappingStatus": "mapped",
    "aliases": [
      "AI + Machine Learning",
      "AWS Earth Observation",
      "AWS Earth Observation (no direct)",
      "Earth Engine",
      "Google Earth Engine",
      "Planetary Computer"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Planetary Computer",
        "providerNamespace": "Microsoft.CognitiveServices",
        "pricingServiceName": "Planetary Computer",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Earth Observation (no direct)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Earth Observation (no direct)",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      },
      "gcp": {
        "canonicalName": "Google Earth Engine",
        "providerNamespace": null,
        "pricingServiceName": "Google Earth Engine",
        "serviceFamily": "AI + Machine Learning",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.analysis-services",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Redshift (OLAP)",
      "Analysis Services",
      "Analytics",
      "BigQuery BI Engine",
      "Looker",
      "Looker / BigQuery BI Engine",
      "Redshift"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Analysis Services",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Analysis Services",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Redshift (OLAP)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Redshift (OLAP)",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Looker / BigQuery BI Engine",
        "providerNamespace": null,
        "pricingServiceName": "Looker",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.azure-purview",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Glue Data Catalog",
      "AWS Glue Data Catalog / Macie",
      "Analytics",
      "Azure Purview",
      "Data Catalog",
      "Dataplex",
      "Dataplex / Data Catalog",
      "Macie",
      "Purview"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Purview",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Purview",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Glue Data Catalog / Macie",
        "providerNamespace": null,
        "pricingServiceName": "AWS Glue Data Catalog",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Dataplex / Data Catalog",
        "providerNamespace": null,
        "pricingServiceName": "Dataplex",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.data-explorer-adx",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Timestream / OpenSearch",
      "Analytics",
      "BigQuery",
      "BigQuery / ClickHouse on GCP",
      "ClickHouse on GCP",
      "Data Explorer",
      "Data Explorer (ADX)",
      "OpenSearch",
      "Timestream"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Data Explorer (ADX)",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Data Explorer (ADX)",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Timestream / OpenSearch",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Timestream",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "BigQuery / ClickHouse on GCP",
        "providerNamespace": null,
        "pricingServiceName": "BigQuery",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.data-factory",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Glue",
      "AWS Glue / Step Functions",
      "Analytics",
      "Cloud Data Fusion",
      "Cloud Data Fusion / Dataflow",
      "Data Factory",
      "Dataflow",
      "Step Functions"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Data Factory",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Data Factory",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Glue / Step Functions",
        "providerNamespace": null,
        "pricingServiceName": "AWS Glue",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Data Fusion / Dataflow",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Data Fusion",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.databricks-azure",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Analytics",
      "Databricks",
      "Databricks (Azure)",
      "Databricks on AWS",
      "Databricks on GCP"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Databricks (Azure)",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Databricks (Azure)",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Databricks on AWS",
        "providerNamespace": null,
        "pricingServiceName": "Databricks on AWS",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Databricks on GCP",
        "providerNamespace": null,
        "pricingServiceName": "Databricks on GCP",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.event-hubs",
    "componentType": "queue",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Kinesis Data Streams",
      "Analytics",
      "Event Hubs",
      "Kinesis Data Streams",
      "Pub",
      "Pub/Sub",
      "Sub"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Event Hubs",
        "providerNamespace": "Microsoft.EventHub",
        "pricingServiceName": "Event Hubs",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Kinesis Data Streams",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Kinesis Data Streams",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Pub/Sub",
        "providerNamespace": null,
        "pricingServiceName": "Pub/Sub",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.graph-data-connect",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Analytics",
      "Graph Data Connect"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Graph Data Connect",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Graph Data Connect",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Analytics",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Analytics",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "analytics.hdinsight",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon EMR",
      "Analytics",
      "Dataproc",
      "EMR",
      "HDInsight"
    ],
    "providers": {
      "azure": {
        "canonicalName": "HDInsight",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "HDInsight",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon EMR",
        "providerNamespace": null,
        "pricingServiceName": "Amazon EMR",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Dataproc",
        "providerNamespace": null,
        "pricingServiceName": "Dataproc",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.microsoft-fabric",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Analytics",
      "AWS Analytics (Glue + Redshift + QuickSight)",
      "Analytics",
      "BigQuery + Looker Studio",
      "Microsoft Fabric"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Microsoft Fabric",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Fabric",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Analytics (Glue + Redshift + QuickSight)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Analytics (Glue + Redshift + QuickSight)",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "BigQuery + Looker Studio",
        "providerNamespace": null,
        "pricingServiceName": "BigQuery + Looker Studio",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.power-bi-embedded",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon QuickSight Embedded",
      "Analytics",
      "Looker Embedded",
      "Power BI Embedded",
      "QuickSight Embedded"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Power BI Embedded",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Power BI Embedded",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon QuickSight Embedded",
        "providerNamespace": null,
        "pricingServiceName": "Amazon QuickSight Embedded",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Looker Embedded",
        "providerNamespace": null,
        "pricingServiceName": "Looker Embedded",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.stream-analytics",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Kinesis Data Analytics",
      "Analytics",
      "Dataflow",
      "Dataflow (streaming)",
      "Kinesis Data Analytics",
      "Stream Analytics"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Stream Analytics",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Stream Analytics",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Kinesis Data Analytics",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Kinesis Data Analytics",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Dataflow (streaming)",
        "providerNamespace": null,
        "pricingServiceName": "Dataflow (streaming)",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "analytics.synapse-analytics",
    "componentType": "unknown",
    "sourceCategory": "Analytics",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Redshift + Glue",
      "Analytics",
      "BigQuery",
      "Redshift + Glue",
      "Synapse Analytics"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Synapse Analytics",
        "providerNamespace": "Microsoft.Analytics",
        "pricingServiceName": "Synapse Analytics",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Redshift + Glue",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Redshift + Glue",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "BigQuery",
        "providerNamespace": null,
        "pricingServiceName": "BigQuery",
        "serviceFamily": "Analytics",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.app-service",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Elastic Beanstalk",
      "AWS Elastic Beanstalk / App Runner",
      "App Engine",
      "App Engine / Cloud Run",
      "App Runner",
      "App Service",
      "Cloud Run",
      "Compute"
    ],
    "providers": {
      "azure": {
        "canonicalName": "App Service",
        "providerNamespace": "Microsoft.Web",
        "pricingServiceName": "App Service",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Elastic Beanstalk / App Runner",
        "providerNamespace": null,
        "pricingServiceName": "AWS Elastic Beanstalk",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "App Engine / Cloud Run",
        "providerNamespace": null,
        "pricingServiceName": "App Engine",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.azure-batch",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Batch",
      "Azure Batch",
      "Batch",
      "Cloud Batch",
      "Compute"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Batch",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Batch",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Batch",
        "providerNamespace": null,
        "pricingServiceName": "AWS Batch",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Batch",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Batch",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "serverless",
    "componentType": "serverless",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Lambda",
      "Azure Functions",
      "Cloud Functions",
      "Compute",
      "Functions"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Functions",
        "providerNamespace": "Microsoft.Web",
        "pricingServiceName": "Functions",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Lambda",
        "providerNamespace": null,
        "pricingServiceName": "AWS Lambda",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Functions",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Functions",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.azure-quantum",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Braket",
      "Azure Quantum",
      "Braket",
      "Compute",
      "Quantum"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Quantum",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Quantum",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Braket",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Braket",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Compute",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "compute.azure-red-hat-openshift",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Azure Red Hat OpenShift",
      "Compute",
      "Red Hat OpenShift",
      "Red Hat OpenShift on AWS",
      "Red Hat OpenShift on AWS (ROSA)",
      "Red Hat OpenShift on GCP"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Red Hat OpenShift",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Red Hat OpenShift",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Red Hat OpenShift on AWS (ROSA)",
        "providerNamespace": null,
        "pricingServiceName": "Red Hat OpenShift on AWS (ROSA)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Red Hat OpenShift on GCP",
        "providerNamespace": null,
        "pricingServiceName": "Red Hat OpenShift on GCP",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.azure-vmware-solution",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Azure VMware Solution",
      "Cloud VMware Engine",
      "Compute",
      "Google Cloud VMware Engine",
      "VMware Cloud on AWS",
      "VMware Solution"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure VMware Solution",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "VMware Solution",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "VMware Cloud on AWS",
        "providerNamespace": null,
        "pricingServiceName": "VMware Cloud on AWS",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Cloud VMware Engine",
        "providerNamespace": null,
        "pricingServiceName": "Google Cloud VMware Engine",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.cloud-services-classic",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Elastic Beanstalk",
      "AWS Elastic Beanstalk (legacy PaaS)",
      "App Engine",
      "App Engine (standard env)",
      "Cloud Services",
      "Cloud Services (classic)",
      "Compute"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Cloud Services (classic)",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Cloud Services (classic)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Elastic Beanstalk (legacy PaaS)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Elastic Beanstalk (legacy PaaS)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "App Engine (standard env)",
        "providerNamespace": null,
        "pricingServiceName": "App Engine (standard env)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.compute-fleet",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Compute",
      "Compute Fleet",
      "EC2 Fleet",
      "EC2 Fleet / Spot Fleet",
      "MIG",
      "MIG (Managed Instance Groups)",
      "Spot Fleet"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Compute Fleet",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Compute Fleet",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "EC2 Fleet / Spot Fleet",
        "providerNamespace": null,
        "pricingServiceName": "EC2 Fleet",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "MIG (Managed Instance Groups)",
        "providerNamespace": null,
        "pricingServiceName": "MIG (Managed Instance Groups)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.container-apps",
    "componentType": "serverless",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS App Runner",
      "AWS App Runner / ECS",
      "Cloud Run",
      "Compute",
      "Container Apps",
      "ECS"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Container Apps",
        "providerNamespace": "Microsoft.App",
        "pricingServiceName": "Container Apps",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS App Runner / ECS",
        "providerNamespace": null,
        "pricingServiceName": "AWS App Runner",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Run",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Run",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.container-instances",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Fargate",
      "AWS Fargate (standalone tasks)",
      "Cloud Run",
      "Cloud Run / GKE Autopilot",
      "Compute",
      "Container Instances",
      "GKE Autopilot"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Container Instances",
        "providerNamespace": "Microsoft.ContainerInstance",
        "pricingServiceName": "Container Instances",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Fargate (standalone tasks)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Fargate (standalone tasks)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Run / GKE Autopilot",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Run",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.container-registry",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon ECR",
      "Artifact Registry",
      "Compute",
      "Container Registry",
      "ECR"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Container Registry",
        "providerNamespace": "Microsoft.ContainerRegistry",
        "pricingServiceName": "Container Registry",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon ECR",
        "providerNamespace": null,
        "pricingServiceName": "Amazon ECR",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Artifact Registry",
        "providerNamespace": null,
        "pricingServiceName": "Artifact Registry",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.cyclecloud-hpc",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS ParallelCluster",
      "Compute",
      "CycleCloud",
      "CycleCloud (HPC)",
      "HPC Toolkit",
      "HPC Toolkit / Slurm on GCP",
      "Slurm on GCP"
    ],
    "providers": {
      "azure": {
        "canonicalName": "CycleCloud (HPC)",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "CycleCloud (HPC)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS ParallelCluster",
        "providerNamespace": null,
        "pricingServiceName": "AWS ParallelCluster",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "HPC Toolkit / Slurm on GCP",
        "providerNamespace": null,
        "pricingServiceName": "HPC Toolkit",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.dedicated-host",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Compute",
      "Dedicated Host",
      "EC2 Dedicated Hosts",
      "Sole-Tenant Nodes"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Dedicated Host",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Dedicated Host",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "EC2 Dedicated Hosts",
        "providerNamespace": null,
        "pricingServiceName": "EC2 Dedicated Hosts",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Sole-Tenant Nodes",
        "providerNamespace": null,
        "pricingServiceName": "Sole-Tenant Nodes",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "kubernetes",
    "componentType": "kubernetes",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon EKS",
      "Compute",
      "EKS",
      "Google Kubernetes Engine (GKE)",
      "Kubernetes Engine",
      "Kubernetes Service",
      "Kubernetes Service (AKS)"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Kubernetes Service (AKS)",
        "providerNamespace": "Microsoft.ContainerService",
        "pricingServiceName": "Kubernetes Service (AKS)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon EKS",
        "providerNamespace": null,
        "pricingServiceName": "Amazon EKS",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Kubernetes Engine (GKE)",
        "providerNamespace": null,
        "pricingServiceName": "Google Kubernetes Engine (GKE)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.service-fabric",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon ECS (cluster mgmt)",
      "Compute",
      "ECS",
      "GKE",
      "GKE (cluster mgmt)",
      "Service Fabric"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Service Fabric",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Service Fabric",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon ECS (cluster mgmt)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon ECS (cluster mgmt)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "GKE (cluster mgmt)",
        "providerNamespace": null,
        "pricingServiceName": "GKE (cluster mgmt)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.virtual-desktop-avd",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon WorkSpaces / AppStream 2.0",
      "AppStream 2.0",
      "Chrome Enterprise",
      "Chrome Enterprise / No direct",
      "Compute",
      "Virtual Desktop",
      "Virtual Desktop (AVD)",
      "WorkSpaces"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Virtual Desktop (AVD)",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Virtual Desktop (AVD)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon WorkSpaces / AppStream 2.0",
        "providerNamespace": null,
        "pricingServiceName": "Amazon WorkSpaces",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Chrome Enterprise / No direct",
        "providerNamespace": null,
        "pricingServiceName": "Chrome Enterprise",
        "serviceFamily": "Compute",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      }
    }
  },
  {
    "serviceKey": "compute",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon EC2",
      "Compute",
      "Compute Engine",
      "EC2",
      "Virtual Machines"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Virtual Machines",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "Virtual Machines",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon EC2",
        "providerNamespace": null,
        "pricingServiceName": "Amazon EC2",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Compute Engine",
        "providerNamespace": null,
        "pricingServiceName": "Compute Engine",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "compute.vm-scale-sets",
    "componentType": "compute",
    "sourceCategory": "Compute",
    "mappingStatus": "mapped",
    "aliases": [
      "Compute",
      "EC2 Auto Scaling Groups",
      "Managed Instance Groups",
      "Managed Instance Groups (MIG)",
      "VM Scale Sets"
    ],
    "providers": {
      "azure": {
        "canonicalName": "VM Scale Sets",
        "providerNamespace": "Microsoft.Compute",
        "pricingServiceName": "VM Scale Sets",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "EC2 Auto Scaling Groups",
        "providerNamespace": null,
        "pricingServiceName": "EC2 Auto Scaling Groups",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Managed Instance Groups (MIG)",
        "providerNamespace": null,
        "pricingServiceName": "Managed Instance Groups (MIG)",
        "serviceFamily": "Compute",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "databases.apache-cassandra-mi",
    "componentType": "database",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Keyspaces (Managed Cassandra)",
      "Apache Cassandra MI",
      "Bigtable",
      "Bigtable (wide-column) / No direct",
      "Databases",
      "Keyspaces"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Apache Cassandra MI",
        "providerNamespace": "Microsoft.DBforPostgreSQL",
        "pricingServiceName": "Apache Cassandra MI",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Keyspaces (Managed Cassandra)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Keyspaces (Managed Cassandra)",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Bigtable (wide-column) / No direct",
        "providerNamespace": null,
        "pricingServiceName": "Bigtable (wide-column)",
        "serviceFamily": "Databases",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      }
    }
  },
  {
    "serviceKey": "databases.cosmos-db",
    "componentType": "database",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon DynamoDB",
      "Cosmos DB",
      "Databases",
      "DynamoDB",
      "Firestore",
      "Firestore / Spanner",
      "Spanner"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Cosmos DB",
        "providerNamespace": "Microsoft.DocumentDB",
        "pricingServiceName": "Cosmos DB",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon DynamoDB",
        "providerNamespace": null,
        "pricingServiceName": "Amazon DynamoDB",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Firestore / Spanner",
        "providerNamespace": null,
        "pricingServiceName": "Firestore",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "databases.database-for-mysql",
    "componentType": "database",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon RDS for MySQL / Aurora MySQL",
      "Aurora MySQL",
      "Cloud SQL for MySQL",
      "Database for MySQL",
      "Databases",
      "RDS for MySQL"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Database for MySQL",
        "providerNamespace": "Microsoft.DBforMySQL",
        "pricingServiceName": "Database for MySQL",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon RDS for MySQL / Aurora MySQL",
        "providerNamespace": null,
        "pricingServiceName": "Amazon RDS for MySQL",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud SQL for MySQL",
        "providerNamespace": null,
        "pricingServiceName": "Cloud SQL for MySQL",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "database.postgresql",
    "componentType": "database",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "AlloyDB",
      "Amazon RDS for PostgreSQL / Aurora PG",
      "Aurora PG",
      "Cloud SQL for PostgreSQL",
      "Cloud SQL for PostgreSQL / AlloyDB",
      "Database for PostgreSQL",
      "Databases",
      "RDS for PostgreSQL"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Database for PostgreSQL",
        "providerNamespace": "Microsoft.DBforPostgreSQL",
        "pricingServiceName": "Database for PostgreSQL",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon RDS for PostgreSQL / Aurora PG",
        "providerNamespace": null,
        "pricingServiceName": "Amazon RDS for PostgreSQL",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud SQL for PostgreSQL / AlloyDB",
        "providerNamespace": null,
        "pricingServiceName": "Cloud SQL for PostgreSQL",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "databases.horizondb",
    "componentType": "database",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "Databases",
      "HorizonDB"
    ],
    "providers": {
      "azure": {
        "canonicalName": "HorizonDB",
        "providerNamespace": "Microsoft.DBforPostgreSQL",
        "pricingServiceName": "HorizonDB",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Databases",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Databases",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "databases.managed-redis",
    "componentType": "cache",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon ElastiCache for Redis",
      "Databases",
      "ElastiCache for Redis",
      "Managed Redis",
      "Memorystore for Redis"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Managed Redis",
        "providerNamespace": "Microsoft.Cache",
        "pricingServiceName": "Managed Redis",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon ElastiCache for Redis",
        "providerNamespace": null,
        "pricingServiceName": "Amazon ElastiCache for Redis",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Memorystore for Redis",
        "providerNamespace": null,
        "pricingServiceName": "Memorystore for Redis",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "cache.redis",
    "componentType": "cache",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon ElastiCache for Redis",
      "Databases",
      "ElastiCache for Redis",
      "Memorystore for Redis",
      "Redis Cache"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Redis Cache",
        "providerNamespace": "Microsoft.Cache",
        "pricingServiceName": "Redis Cache",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon ElastiCache for Redis",
        "providerNamespace": null,
        "pricingServiceName": "Amazon ElastiCache for Redis",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Memorystore for Redis",
        "providerNamespace": null,
        "pricingServiceName": "Memorystore for Redis",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "databases.sql-database",
    "componentType": "database",
    "sourceCategory": "Databases",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon RDS for SQL Server / Aurora",
      "Aurora",
      "Cloud SQL for SQL Server",
      "Databases",
      "RDS for SQL Server",
      "SQL Database"
    ],
    "providers": {
      "azure": {
        "canonicalName": "SQL Database",
        "providerNamespace": "Microsoft.Sql",
        "pricingServiceName": "SQL Database",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon RDS for SQL Server / Aurora",
        "providerNamespace": null,
        "pricingServiceName": "Amazon RDS for SQL Server",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud SQL for SQL Server",
        "providerNamespace": null,
        "pricingServiceName": "Cloud SQL for SQL Server",
        "serviceFamily": "Databases",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.app-configuration",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS AppConfig",
      "AWS AppConfig / Systems Manager",
      "App Configuration",
      "Development",
      "Firebase Remote Config",
      "Runtime Configurator",
      "Runtime Configurator / Firebase Remote Config",
      "Systems Manager"
    ],
    "providers": {
      "azure": {
        "canonicalName": "App Configuration",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "App Configuration",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS AppConfig / Systems Manager",
        "providerNamespace": null,
        "pricingServiceName": "AWS AppConfig",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Runtime Configurator / Firebase Remote Config",
        "providerNamespace": null,
        "pricingServiceName": "Runtime Configurator",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.app-testing-load",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Load Testing",
      "AWS Load Testing (Artillery/k6)",
      "App Testing",
      "App Testing (Load)",
      "Cloud Load Testing",
      "Cloud Load Testing (no native)",
      "Development"
    ],
    "providers": {
      "azure": {
        "canonicalName": "App Testing (Load)",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "App Testing (Load)",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Load Testing (Artillery/k6)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Load Testing (Artillery/k6)",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Load Testing (no native)",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Load Testing (no native)",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.azure-chaos-studio",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Fault Injection Simulator",
      "AWS Fault Injection Simulator (FIS)",
      "Azure Chaos Studio",
      "Chaos Studio",
      "Development"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Chaos Studio",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "Chaos Studio",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Fault Injection Simulator (FIS)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Fault Injection Simulator (FIS)",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Development",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "development.azure-devops",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS CodePipeline + CodeBuild + CodeCommit",
      "Azure DevOps",
      "Cloud Build + Cloud Source Repositories",
      "DevOps",
      "Development"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure DevOps",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "DevOps",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS CodePipeline + CodeBuild + CodeCommit",
        "providerNamespace": null,
        "pricingServiceName": "AWS CodePipeline + CodeBuild + CodeCommit",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Build + Cloud Source Repositories",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Build + Cloud Source Repositories",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.azure-spring-apps",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS App Runner",
      "AWS App Runner / Elastic Beanstalk",
      "Azure Spring Apps",
      "Cloud for Spring",
      "Development",
      "Elastic Beanstalk",
      "Google Cloud for Spring",
      "Spring Apps"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Spring Apps",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "Spring Apps",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS App Runner / Elastic Beanstalk",
        "providerNamespace": null,
        "pricingServiceName": "AWS App Runner",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Cloud for Spring",
        "providerNamespace": null,
        "pricingServiceName": "Google Cloud for Spring",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.deployment-environments",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS CodeCatalyst Dev Environments",
      "Cloud Workstations",
      "Deployment Environments",
      "Development"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Deployment Environments",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "Deployment Environments",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS CodeCatalyst Dev Environments",
        "providerNamespace": null,
        "pricingServiceName": "AWS CodeCatalyst Dev Environments",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Workstations",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Workstations",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.devtest-labs",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Cloud9",
      "AWS Cloud9 / Development environments",
      "Cloud Workstations",
      "DevTest Labs",
      "Development",
      "Development environments"
    ],
    "providers": {
      "azure": {
        "canonicalName": "DevTest Labs",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "DevTest Labs",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Cloud9 / Development environments",
        "providerNamespace": null,
        "pricingServiceName": "AWS Cloud9",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Workstations",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Workstations",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.lab-services",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS WorkSpaces",
      "AWS WorkSpaces (classroom use)",
      "Development",
      "Lab Services"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Lab Services",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "Lab Services",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS WorkSpaces (classroom use)",
        "providerNamespace": null,
        "pricingServiceName": "AWS WorkSpaces (classroom use)",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Development",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "development.managed-grafana",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Managed Grafana",
      "Cloud Monitoring",
      "Cloud Monitoring (Grafana plugin)",
      "Development",
      "Managed Grafana"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Managed Grafana",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "Managed Grafana",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Managed Grafana",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Managed Grafana",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Monitoring (Grafana plugin)",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Monitoring (Grafana plugin)",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.microsoft-dev-box",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS CodeCatalyst Dev Environments",
      "Cloud Workstations",
      "Development",
      "Microsoft Dev Box"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Microsoft Dev Box",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "Dev Box",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS CodeCatalyst Dev Environments",
        "providerNamespace": null,
        "pricingServiceName": "AWS CodeCatalyst Dev Environments",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Workstations",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Workstations",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "development.signalr-service",
    "componentType": "unknown",
    "sourceCategory": "Development",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS API Gateway WebSocket",
      "AWS API Gateway WebSocket / AppSync",
      "AppSync",
      "Development",
      "Firebase Realtime DB",
      "Firebase Realtime DB / No direct",
      "SignalR Service"
    ],
    "providers": {
      "azure": {
        "canonicalName": "SignalR Service",
        "providerNamespace": "Microsoft.DevCenter",
        "pricingServiceName": "SignalR Service",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS API Gateway WebSocket / AppSync",
        "providerNamespace": null,
        "pricingServiceName": "AWS API Gateway WebSocket",
        "serviceFamily": "Development",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Firebase Realtime DB / No direct",
        "providerNamespace": null,
        "pricingServiceName": "Firebase Realtime DB",
        "serviceFamily": "Development",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      }
    }
  },
  {
    "serviceKey": "identity-security.azure-ad-external-identities",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AD External Identities",
      "Amazon Cognito",
      "Azure AD External Identities",
      "Cognito",
      "Firebase Authentication",
      "Firebase Authentication / Identity Platform",
      "Identity + Security",
      "Identity Platform"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure AD External Identities",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "AD External Identities",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Cognito",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Cognito",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Firebase Authentication / Identity Platform",
        "providerNamespace": null,
        "pricingServiceName": "Firebase Authentication",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.azure-key-vault",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Secrets Manager + KMS",
      "Azure Key Vault",
      "Identity + Security",
      "Key Vault",
      "Secret Manager + Cloud KMS"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Key Vault",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Key Vault",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Secrets Manager + KMS",
        "providerNamespace": null,
        "pricingServiceName": "AWS Secrets Manager + KMS",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Secret Manager + Cloud KMS",
        "providerNamespace": null,
        "pricingServiceName": "Secret Manager + Cloud KMS",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.copilot-for-security",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Security Lake + AI",
      "Copilot for Security",
      "Identity + Security",
      "Security Command Center AI",
      "Security Lake + AI"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Copilot for Security",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Copilot for Security",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Security Lake + AI",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Security Lake + AI",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Security Command Center AI",
        "providerNamespace": null,
        "pricingServiceName": "Security Command Center AI",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.ddos-protection",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Shield",
      "Cloud Armor",
      "DDoS Protection",
      "Identity + Security"
    ],
    "providers": {
      "azure": {
        "canonicalName": "DDoS Protection",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "DDoS Protection",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Shield",
        "providerNamespace": null,
        "pricingServiceName": "AWS Shield",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Armor",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Armor",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.dedicated-hsm",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS CloudHSM",
      "Cloud HSM",
      "Dedicated HSM",
      "Identity + Security"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Dedicated HSM",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Dedicated HSM",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS CloudHSM",
        "providerNamespace": null,
        "pricingServiceName": "AWS CloudHSM",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud HSM",
        "providerNamespace": null,
        "pricingServiceName": "Cloud HSM",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.defender-easm",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Security Hub",
      "AWS Security Hub (partial)",
      "Defender EASM",
      "Identity + Security",
      "Security Command Center",
      "Security Command Center (partial)"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Defender EASM",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Defender EASM",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Security Hub (partial)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Security Hub (partial)",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Security Command Center (partial)",
        "providerNamespace": null,
        "pricingServiceName": "Security Command Center (partial)",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "security",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Security Hub",
      "Defender for Cloud",
      "Identity + Security",
      "Security Command Center"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Defender for Cloud",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Defender for Cloud",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Security Hub",
        "providerNamespace": null,
        "pricingServiceName": "AWS Security Hub",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Security Command Center",
        "providerNamespace": null,
        "pricingServiceName": "Security Command Center",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.defender-for-iot",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IoT Device Defender",
      "Defender for IoT",
      "Identity + Security"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Defender for IoT",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Defender for IoT",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IoT Device Defender",
        "providerNamespace": null,
        "pricingServiceName": "AWS IoT Device Defender",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Identity + Security",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "identity-security.information-protection-mip",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Macie",
      "AWS Macie (data classification)",
      "Cloud DLP",
      "Cloud DLP / Sensitive Data Protection",
      "Identity + Security",
      "Information Protection",
      "Information Protection (MIP)",
      "Sensitive Data Protection"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Information Protection (MIP)",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Information Protection (MIP)",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Macie (data classification)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Macie (data classification)",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud DLP / Sensitive Data Protection",
        "providerNamespace": null,
        "pricingServiceName": "Cloud DLP",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.microsoft-entra-ds",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Directory Service",
      "AWS Directory Service (AD)",
      "Identity + Security",
      "Managed Microsoft AD",
      "Microsoft Entra DS"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Microsoft Entra DS",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Entra DS",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Directory Service (AD)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Directory Service (AD)",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Managed Microsoft AD",
        "providerNamespace": null,
        "pricingServiceName": "Managed Microsoft AD",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.microsoft-entra-id",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IAM + IAM Identity Center",
      "Cloud Identity",
      "Cloud Identity / IAM",
      "IAM",
      "Identity + Security",
      "Microsoft Entra ID"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Microsoft Entra ID",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Entra ID",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IAM + IAM Identity Center",
        "providerNamespace": null,
        "pricingServiceName": "AWS IAM + IAM Identity Center",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Identity / IAM",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Identity",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.microsoft-sentinel-siem",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Security Lake + OpenSearch SIEM",
      "Chronicle SIEM",
      "Chronicle SIEM (Google Security Ops)",
      "Identity + Security",
      "Microsoft Sentinel",
      "Microsoft Sentinel (SIEM)",
      "Security Lake + OpenSearch SIEM"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Microsoft Sentinel (SIEM)",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Sentinel (SIEM)",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Security Lake + OpenSearch SIEM",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Security Lake + OpenSearch SIEM",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Chronicle SIEM (Google Security Ops)",
        "providerNamespace": null,
        "pricingServiceName": "Chronicle SIEM (Google Security Ops)",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "identity-security.trusted-signing",
    "componentType": "security",
    "sourceCategory": "Identity + Security",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Signer",
      "Binary Authorization",
      "Identity + Security",
      "Trusted Signing"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Trusted Signing",
        "providerNamespace": "Microsoft.Security",
        "pricingServiceName": "Trusted Signing",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Signer",
        "providerNamespace": null,
        "pricingServiceName": "AWS Signer",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Binary Authorization",
        "providerNamespace": null,
        "pricingServiceName": "Binary Authorization",
        "serviceFamily": "Identity + Security",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "iot-mr.azure-maps",
    "componentType": "unknown",
    "sourceCategory": "IoT + MR",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Location Service",
      "Azure Maps",
      "Google Maps Platform",
      "IoT + MR",
      "Location Service",
      "Maps",
      "Maps Platform"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Maps",
        "providerNamespace": "Microsoft.Devices",
        "pricingServiceName": "Maps",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Location Service",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Location Service",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Maps Platform",
        "providerNamespace": null,
        "pricingServiceName": "Google Maps Platform",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "iot-mr.azure-sphere",
    "componentType": "unknown",
    "sourceCategory": "IoT + MR",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IoT Greengrass",
      "AWS IoT Greengrass (edge OS)",
      "Azure Sphere",
      "IoT + MR",
      "Sphere"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Sphere",
        "providerNamespace": "Microsoft.Devices",
        "pricingServiceName": "Sphere",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IoT Greengrass (edge OS)",
        "providerNamespace": null,
        "pricingServiceName": "AWS IoT Greengrass (edge OS)",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "IoT + MR",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "iot-mr.digital-twins",
    "componentType": "unknown",
    "sourceCategory": "IoT + MR",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IoT TwinMaker",
      "Digital Twins",
      "IoT + MR"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Digital Twins",
        "providerNamespace": "Microsoft.Devices",
        "pricingServiceName": "Digital Twins",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IoT TwinMaker",
        "providerNamespace": null,
        "pricingServiceName": "AWS IoT TwinMaker",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "IoT + MR",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "iot-mr.iot-central",
    "componentType": "security",
    "sourceCategory": "IoT + MR",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IoT Core + SiteWise",
      "IoT + MR",
      "IoT Central",
      "IoT Core",
      "IoT Core / Pub/Sub",
      "Pub",
      "Sub"
    ],
    "providers": {
      "azure": {
        "canonicalName": "IoT Central",
        "providerNamespace": "Microsoft.Devices",
        "pricingServiceName": "IoT Central",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IoT Core + SiteWise",
        "providerNamespace": null,
        "pricingServiceName": "AWS IoT Core + SiteWise",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "IoT Core / Pub/Sub",
        "providerNamespace": null,
        "pricingServiceName": "IoT Core",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "iot-mr.iot-edge",
    "componentType": "unknown",
    "sourceCategory": "IoT + MR",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IoT Greengrass",
      "Edge TPU",
      "Edge TPU / IoT Core",
      "IoT + MR",
      "IoT Core",
      "IoT Edge"
    ],
    "providers": {
      "azure": {
        "canonicalName": "IoT Edge",
        "providerNamespace": "Microsoft.Devices",
        "pricingServiceName": "IoT Edge",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IoT Greengrass",
        "providerNamespace": null,
        "pricingServiceName": "AWS IoT Greengrass",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Edge TPU / IoT Core",
        "providerNamespace": null,
        "pricingServiceName": "Edge TPU",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "iot-mr.iot-hub",
    "componentType": "unknown",
    "sourceCategory": "IoT + MR",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IoT Core",
      "Cloud IoT Core",
      "Cloud IoT Core (deprecated Pub/Sub)",
      "IoT + MR",
      "IoT Hub"
    ],
    "providers": {
      "azure": {
        "canonicalName": "IoT Hub",
        "providerNamespace": "Microsoft.Devices",
        "pricingServiceName": "IoT Hub",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IoT Core",
        "providerNamespace": null,
        "pricingServiceName": "AWS IoT Core",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud IoT Core (deprecated Pub/Sub)",
        "providerNamespace": null,
        "pricingServiceName": "Cloud IoT Core (deprecated Pub/Sub)",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "iot-mr.iot-operations",
    "componentType": "unknown",
    "sourceCategory": "IoT + MR",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS IoT SiteWise",
      "IoT + MR",
      "IoT Operations"
    ],
    "providers": {
      "azure": {
        "canonicalName": "IoT Operations",
        "providerNamespace": "Microsoft.Devices",
        "pricingServiceName": "IoT Operations",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS IoT SiteWise",
        "providerNamespace": null,
        "pricingServiceName": "AWS IoT SiteWise",
        "serviceFamily": "IoT + MR",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "IoT + MR",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "integration.api-center",
    "componentType": "unknown",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "API Center",
      "AWS API Gateway + EventBridge",
      "Apigee API Hub",
      "Integration"
    ],
    "providers": {
      "azure": {
        "canonicalName": "API Center",
        "providerNamespace": "Microsoft.ServiceBus",
        "pricingServiceName": "API Center",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS API Gateway + EventBridge",
        "providerNamespace": null,
        "pricingServiceName": "AWS API Gateway + EventBridge",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Apigee API Hub",
        "providerNamespace": null,
        "pricingServiceName": "Apigee API Hub",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "integration.api-management",
    "componentType": "unknown",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "API Gateway",
      "API Management",
      "Amazon API Gateway",
      "Apigee API Management",
      "Integration"
    ],
    "providers": {
      "azure": {
        "canonicalName": "API Management",
        "providerNamespace": "Microsoft.ApiManagement",
        "pricingServiceName": "API Management",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon API Gateway",
        "providerNamespace": null,
        "pricingServiceName": "Amazon API Gateway",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Apigee API Management",
        "providerNamespace": null,
        "pricingServiceName": "Apigee API Management",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "integration.energy-data-manager",
    "componentType": "unknown",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Energy",
      "AWS Energy (no direct)",
      "Energy Data Manager",
      "Integration"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Energy Data Manager",
        "providerNamespace": "Microsoft.ServiceBus",
        "pricingServiceName": "Energy Data Manager",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Energy (no direct)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Energy (no direct)",
        "serviceFamily": "Integration",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Integration",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "integration.event-grid",
    "componentType": "queue",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon EventBridge",
      "Event Grid",
      "EventBridge",
      "Eventarc",
      "Integration"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Event Grid",
        "providerNamespace": "Microsoft.EventGrid",
        "pricingServiceName": "Event Grid",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon EventBridge",
        "providerNamespace": null,
        "pricingServiceName": "Amazon EventBridge",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Eventarc",
        "providerNamespace": null,
        "pricingServiceName": "Eventarc",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "integration.health-data-services",
    "componentType": "unknown",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS HealthLake",
      "AWS HealthLake / HealthOmics",
      "Cloud Healthcare API",
      "Health Data Services",
      "HealthOmics",
      "Integration"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Health Data Services",
        "providerNamespace": "Microsoft.ServiceBus",
        "pricingServiceName": "Health Data Services",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS HealthLake / HealthOmics",
        "providerNamespace": null,
        "pricingServiceName": "AWS HealthLake",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Healthcare API",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Healthcare API",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "integration.logic-apps",
    "componentType": "serverless",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Step Functions",
      "Cloud Composer",
      "Cloud Composer / Workflows",
      "Integration",
      "Logic Apps",
      "Workflows"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Logic Apps",
        "providerNamespace": "Microsoft.Logic",
        "pricingServiceName": "Logic Apps",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Step Functions",
        "providerNamespace": null,
        "pricingServiceName": "AWS Step Functions",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Composer / Workflows",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Composer",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "integration.notification-hubs",
    "componentType": "queue",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon SNS + Pinpoint",
      "Firebase Cloud Messaging",
      "Firebase Cloud Messaging (FCM)",
      "Integration",
      "Notification Hubs",
      "SNS + Pinpoint"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Notification Hubs",
        "providerNamespace": "Microsoft.ServiceBus",
        "pricingServiceName": "Notification Hubs",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon SNS + Pinpoint",
        "providerNamespace": null,
        "pricingServiceName": "Amazon SNS + Pinpoint",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Firebase Cloud Messaging (FCM)",
        "providerNamespace": null,
        "pricingServiceName": "Firebase Cloud Messaging (FCM)",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "queue",
    "componentType": "queue",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon SQS + SNS",
      "Integration",
      "Pub",
      "Pub/Sub",
      "SQS + SNS",
      "Service Bus",
      "Sub"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Service Bus",
        "providerNamespace": "Microsoft.ServiceBus",
        "pricingServiceName": "Service Bus",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon SQS + SNS",
        "providerNamespace": null,
        "pricingServiceName": "Amazon SQS + SNS",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Pub/Sub",
        "providerNamespace": null,
        "pricingServiceName": "Pub/Sub",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "integration.web-pubsub",
    "componentType": "unknown",
    "sourceCategory": "Integration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS API Gateway WebSocket",
      "Firebase Realtime DB",
      "Firebase Realtime DB / No direct",
      "Integration",
      "Web PubSub"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Web PubSub",
        "providerNamespace": "Microsoft.ServiceBus",
        "pricingServiceName": "Web PubSub",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS API Gateway WebSocket",
        "providerNamespace": null,
        "pricingServiceName": "AWS API Gateway WebSocket",
        "serviceFamily": "Integration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Firebase Realtime DB / No direct",
        "providerNamespace": null,
        "pricingServiceName": "Firebase Realtime DB",
        "serviceFamily": "Integration",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      }
    }
  },
  {
    "serviceKey": "management-governance.automation",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Systems Manager Automation",
      "AWS Systems Manager Automation / OpsWorks",
      "Automation",
      "Cloud Composer",
      "Cloud Composer / Config Management",
      "Config Management",
      "Management + Governance",
      "OpsWorks"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Automation",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Automation",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Systems Manager Automation / OpsWorks",
        "providerNamespace": null,
        "pricingServiceName": "AWS Systems Manager Automation",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Composer / Config Management",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Composer",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.azure-advisor",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Trusted Advisor",
      "Advisor",
      "Azure Advisor",
      "Management + Governance",
      "Recommender"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Advisor",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Advisor",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Trusted Advisor",
        "providerNamespace": null,
        "pricingServiceName": "AWS Trusted Advisor",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Recommender",
        "providerNamespace": null,
        "pricingServiceName": "Recommender",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.azure-arc",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Outposts",
      "AWS Outposts / EKS Anywhere",
      "Anthos",
      "Anthos / GKE Enterprise",
      "Arc",
      "Azure Arc",
      "EKS Anywhere",
      "GKE Enterprise",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Arc",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Arc",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Outposts / EKS Anywhere",
        "providerNamespace": null,
        "pricingServiceName": "AWS Outposts",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Anthos / GKE Enterprise",
        "providerNamespace": null,
        "pricingServiceName": "Anthos",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.azure-automanage",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Systems Manager",
      "Automanage",
      "Azure Automanage",
      "Config Management",
      "Management + Governance",
      "OS Config",
      "OS Config / Config Management"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Automanage",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Automanage",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Systems Manager",
        "providerNamespace": null,
        "pricingServiceName": "AWS Systems Manager",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "OS Config / Config Management",
        "providerNamespace": null,
        "pricingServiceName": "OS Config",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "backup",
    "componentType": "backup",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Backup",
      "Azure Backup",
      "Backup",
      "Cloud Backup and DR",
      "Google Cloud Backup and DR",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Backup",
        "providerNamespace": "Microsoft.RecoveryServices",
        "pricingServiceName": "Backup",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Backup",
        "providerNamespace": null,
        "pricingServiceName": "AWS Backup",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Cloud Backup and DR",
        "providerNamespace": null,
        "pricingServiceName": "Google Cloud Backup and DR",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.azure-blueprints",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS CloudFormation StackSets",
      "AWS CloudFormation StackSets / Control Tower",
      "Azure Blueprints",
      "Blueprints",
      "Config Sync",
      "Control Tower",
      "Deployment Manager",
      "Deployment Manager / Config Sync",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Blueprints",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Blueprints",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS CloudFormation StackSets / Control Tower",
        "providerNamespace": null,
        "pricingServiceName": "AWS CloudFormation StackSets",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Deployment Manager / Config Sync",
        "providerNamespace": null,
        "pricingServiceName": "Deployment Manager",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.azure-lighthouse",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Organizations + IAM cross-account",
      "Azure Lighthouse",
      "Folders",
      "Lighthouse",
      "Management + Governance",
      "Resource Manager",
      "Resource Manager / Folders"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Lighthouse",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Lighthouse",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Organizations + IAM cross-account",
        "providerNamespace": null,
        "pricingServiceName": "AWS Organizations + IAM cross-account",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Resource Manager / Folders",
        "providerNamespace": null,
        "pricingServiceName": "Resource Manager",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "monitoring",
    "componentType": "monitoring",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon CloudWatch",
      "Azure Monitor",
      "Cloud Monitoring",
      "CloudWatch",
      "Management + Governance",
      "Monitor"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Monitor",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Monitor",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon CloudWatch",
        "providerNamespace": null,
        "pricingServiceName": "Amazon CloudWatch",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Monitoring",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Monitoring",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.azure-policy",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Config + Service Control Policies",
      "Azure Policy",
      "Management + Governance",
      "Organization Policy Service",
      "Policy"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Policy",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Policy",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Config + Service Control Policies",
        "providerNamespace": null,
        "pricingServiceName": "AWS Config + Service Control Policies",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Organization Policy Service",
        "providerNamespace": null,
        "pricingServiceName": "Organization Policy Service",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.azure-portal",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Management Console",
      "Azure Portal",
      "Cloud Console",
      "Google Cloud Console",
      "Management + Governance",
      "Portal"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Portal",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Portal",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Management Console",
        "providerNamespace": null,
        "pricingServiceName": "AWS Management Console",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Cloud Console",
        "providerNamespace": null,
        "pricingServiceName": "Google Cloud Console",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.carbon-optimization",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Customer Carbon Footprint Tool",
      "Carbon Optimization",
      "Cloud Carbon Footprint",
      "Google Cloud Carbon Footprint",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Carbon Optimization",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Carbon Optimization",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Customer Carbon Footprint Tool",
        "providerNamespace": null,
        "pricingServiceName": "AWS Customer Carbon Footprint Tool",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Google Cloud Carbon Footprint",
        "providerNamespace": null,
        "pricingServiceName": "Google Cloud Carbon Footprint",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.cloud-shell",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS CloudShell",
      "Cloud Shell",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Cloud Shell",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Cloud Shell",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS CloudShell",
        "providerNamespace": null,
        "pricingServiceName": "AWS CloudShell",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Shell",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Shell",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.copilot-in-azure",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Q (AWS AI assistant)",
      "Copilot in Azure",
      "Gemini in Cloud",
      "Gemini in Google Cloud",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Copilot in Azure",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Copilot in Azure",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Q (AWS AI assistant)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Q (AWS AI assistant)",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Gemini in Google Cloud",
        "providerNamespace": null,
        "pricingServiceName": "Gemini in Google Cloud",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.cost-management",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Cost Explorer + Budgets",
      "Cloud Billing",
      "Cloud Billing / Cost Management",
      "Cost Management",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Cost Management",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Cost Management",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Cost Explorer + Budgets",
        "providerNamespace": null,
        "pricingServiceName": "AWS Cost Explorer + Budgets",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Billing / Cost Management",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Billing",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.kubernetes-fleet-manager",
    "componentType": "kubernetes",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon EKS Anywhere / Fleet",
      "EKS Anywhere",
      "Fleet",
      "GKE Fleet Management",
      "Kubernetes Fleet Manager",
      "Management + Governance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Kubernetes Fleet Manager",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Kubernetes Fleet Manager",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon EKS Anywhere / Fleet",
        "providerNamespace": null,
        "pricingServiceName": "Amazon EKS Anywhere",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "GKE Fleet Management",
        "providerNamespace": null,
        "pricingServiceName": "GKE Fleet Management",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.managed-apps",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Service Catalog",
      "Managed Apps",
      "Management + Governance",
      "Service Catalog"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Managed Apps",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Managed Apps",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Service Catalog",
        "providerNamespace": null,
        "pricingServiceName": "AWS Service Catalog",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Service Catalog",
        "providerNamespace": null,
        "pricingServiceName": "Service Catalog",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "management-governance.sre-agent",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "Management + Governance",
      "SRE Agent"
    ],
    "providers": {
      "azure": {
        "canonicalName": "SRE Agent",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "SRE Agent",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Management + Governance",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Management + Governance",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "management-governance.update-manager",
    "componentType": "unknown",
    "sourceCategory": "Management + Governance",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Systems Manager Patch Manager",
      "Management + Governance",
      "OS Config Patch Management",
      "Update Manager"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Update Manager",
        "providerNamespace": "Microsoft.Insights",
        "pricingServiceName": "Update Manager",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Systems Manager Patch Manager",
        "providerNamespace": null,
        "pricingServiceName": "AWS Systems Manager Patch Manager",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "OS Config Patch Management",
        "providerNamespace": null,
        "pricingServiceName": "OS Config Patch Management",
        "serviceFamily": "Management + Governance",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "cdn",
    "componentType": "cdn",
    "sourceCategory": "Media + Comms",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon CloudFront",
      "Azure CDN",
      "CDN",
      "Cloud CDN",
      "CloudFront",
      "Media + Comms"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure CDN",
        "providerNamespace": "Microsoft.Cdn",
        "pricingServiceName": "CDN",
        "serviceFamily": "Media + Comms",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon CloudFront",
        "providerNamespace": null,
        "pricingServiceName": "Amazon CloudFront",
        "serviceFamily": "Media + Comms",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud CDN",
        "providerNamespace": null,
        "pricingServiceName": "Cloud CDN",
        "serviceFamily": "Media + Comms",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "media-comms.azure-comms-gateway",
    "componentType": "unknown",
    "sourceCategory": "Media + Comms",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Chime SDK (SIP/PSTN)",
      "Azure Comms. Gateway",
      "Chime SDK",
      "Comms. Gateway",
      "Media + Comms"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Comms. Gateway",
        "providerNamespace": "Microsoft.Media",
        "pricingServiceName": "Comms. Gateway",
        "serviceFamily": "Media + Comms",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Chime SDK (SIP/PSTN)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Chime SDK (SIP/PSTN)",
        "serviceFamily": "Media + Comms",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Media + Comms",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "media-comms.communication-services",
    "componentType": "unknown",
    "sourceCategory": "Media + Comms",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Chime SDK / Pinpoint",
      "Chime SDK",
      "Communication Services",
      "Media + Comms",
      "Pinpoint"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Communication Services",
        "providerNamespace": "Microsoft.Media",
        "pricingServiceName": "Communication Services",
        "serviceFamily": "Media + Comms",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Chime SDK / Pinpoint",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Chime SDK",
        "serviceFamily": "Media + Comms",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Media + Comms",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "migration.azure-migrate",
    "componentType": "unknown",
    "sourceCategory": "Migration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Migration Hub",
      "Azure Migrate",
      "Migrate",
      "Migrate for Compute Engine",
      "Migrate to Virtual Machines",
      "Migrate to Virtual Machines / Migrate for Compute Engine",
      "Migration"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Migrate",
        "providerNamespace": "Microsoft.Migrate",
        "pricingServiceName": "Migrate",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Migration Hub",
        "providerNamespace": null,
        "pricingServiceName": "AWS Migration Hub",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Migrate to Virtual Machines / Migrate for Compute Engine",
        "providerNamespace": null,
        "pricingServiceName": "Migrate to Virtual Machines",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "migration.data-box",
    "componentType": "unknown",
    "sourceCategory": "Migration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Snowball",
      "AWS Snowball / Snowcone",
      "Data Box",
      "Migration",
      "Snowcone",
      "Transfer Appliance"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Data Box",
        "providerNamespace": "Microsoft.Migrate",
        "pricingServiceName": "Data Box",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Snowball / Snowcone",
        "providerNamespace": null,
        "pricingServiceName": "AWS Snowball",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Transfer Appliance",
        "providerNamespace": null,
        "pricingServiceName": "Transfer Appliance",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "migration.db-migration-service",
    "componentType": "unknown",
    "sourceCategory": "Migration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Database Migration Service",
      "AWS Database Migration Service (DMS)",
      "DB Migration Service",
      "Database Migration Service",
      "Migration"
    ],
    "providers": {
      "azure": {
        "canonicalName": "DB Migration Service",
        "providerNamespace": "Microsoft.Migrate",
        "pricingServiceName": "DB Migration Service",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Database Migration Service (DMS)",
        "providerNamespace": null,
        "pricingServiceName": "AWS Database Migration Service (DMS)",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Database Migration Service",
        "providerNamespace": null,
        "pricingServiceName": "Database Migration Service",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "migration.resource-mover",
    "componentType": "unknown",
    "sourceCategory": "Migration",
    "mappingStatus": "mapped",
    "aliases": [
      "Migration",
      "Resource Mover"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Resource Mover",
        "providerNamespace": "Microsoft.Migrate",
        "pricingServiceName": "Resource Mover",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Migration",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Migration",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "migration.site-recovery-dr",
    "componentType": "backup",
    "sourceCategory": "Migration",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Elastic Disaster Recovery",
      "Backup and DR Service",
      "Migration",
      "Site Recovery",
      "Site Recovery (DR)"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Site Recovery (DR)",
        "providerNamespace": "Microsoft.Migrate",
        "pricingServiceName": "Site Recovery (DR)",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Elastic Disaster Recovery",
        "providerNamespace": null,
        "pricingServiceName": "AWS Elastic Disaster Recovery",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Backup and DR Service",
        "providerNamespace": null,
        "pricingServiceName": "Backup and DR Service",
        "serviceFamily": "Migration",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "load_balancer.http_s",
    "componentType": "load_balancer",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS ALB",
      "AWS ALB (Application Load Balancer)",
      "Application Gateway",
      "Cloud Load Balancing",
      "Cloud Load Balancing (HTTP/S)",
      "Networking"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Application Gateway",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Application Gateway",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS ALB (Application Load Balancer)",
        "providerNamespace": null,
        "pricingServiceName": "AWS ALB (Application Load Balancer)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Load Balancing (HTTP/S)",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Load Balancing (HTTP/S)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.azure-bastion",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Systems Manager Session Manager",
      "Azure Bastion",
      "Bastion",
      "Identity-Aware Proxy (IAP) tunneling",
      "Identity-Aware Proxy tunneling",
      "Networking"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Bastion",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Bastion",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Systems Manager Session Manager",
        "providerNamespace": null,
        "pricingServiceName": "AWS Systems Manager Session Manager",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Identity-Aware Proxy (IAP) tunneling",
        "providerNamespace": null,
        "pricingServiceName": "Identity-Aware Proxy (IAP) tunneling",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.azure-dns",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Route 53",
      "Azure DNS",
      "Cloud DNS",
      "DNS",
      "Networking",
      "Route 53"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure DNS",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "DNS",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Route 53",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Route 53",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud DNS",
        "providerNamespace": null,
        "pricingServiceName": "Cloud DNS",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.azure-firewall",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Network Firewall",
      "Azure Firewall",
      "Cloud Armor",
      "Cloud NGFW",
      "Cloud NGFW / Cloud Armor",
      "Firewall",
      "Networking"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Firewall",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Firewall",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Network Firewall",
        "providerNamespace": null,
        "pricingServiceName": "AWS Network Firewall",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud NGFW / Cloud Armor",
        "providerNamespace": null,
        "pricingServiceName": "Cloud NGFW",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.azure-front-door",
    "componentType": "cdn",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon CloudFront + WAF + Shield",
      "Azure Front Door",
      "Cloud CDN + Cloud Armor + Load Balancing",
      "CloudFront + WAF + Shield",
      "Front Door",
      "Networking"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Front Door",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Front Door",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon CloudFront + WAF + Shield",
        "providerNamespace": null,
        "pricingServiceName": "Amazon CloudFront + WAF + Shield",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud CDN + Cloud Armor + Load Balancing",
        "providerNamespace": null,
        "pricingServiceName": "Cloud CDN + Cloud Armor + Load Balancing",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.expressroute",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Direct Connect",
      "Cloud Interconnect",
      "Cloud Interconnect (Dedicated/Partner)",
      "ExpressRoute",
      "Networking"
    ],
    "providers": {
      "azure": {
        "canonicalName": "ExpressRoute",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "ExpressRoute",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Direct Connect",
        "providerNamespace": null,
        "pricingServiceName": "AWS Direct Connect",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Interconnect (Dedicated/Partner)",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Interconnect (Dedicated/Partner)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "load_balancer.tcp",
    "componentType": "load_balancer",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS NLB",
      "AWS NLB (Network Load Balancer)",
      "Cloud Load Balancing",
      "Cloud Load Balancing (TCP/UDP)",
      "Load Balancer",
      "Networking"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Load Balancer",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Load Balancer",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS NLB (Network Load Balancer)",
        "providerNamespace": null,
        "pricingServiceName": "AWS NLB (Network Load Balancer)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Load Balancing (TCP/UDP)",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Load Balancing (TCP/UDP)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.network-watcher",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS VPC Flow Logs + Reachability Analyzer",
      "Network Intelligence Center",
      "Network Watcher",
      "Networking"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Network Watcher",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Network Watcher",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS VPC Flow Logs + Reachability Analyzer",
        "providerNamespace": null,
        "pricingServiceName": "AWS VPC Flow Logs + Reachability Analyzer",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Network Intelligence Center",
        "providerNamespace": null,
        "pricingServiceName": "Network Intelligence Center",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.private-5g-core",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Private 5G",
      "Networking",
      "Private 5G Core"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Private 5G Core",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Private 5G Core",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Private 5G",
        "providerNamespace": null,
        "pricingServiceName": "AWS Private 5G",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Networking",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "networking.private-link",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS PrivateLink",
      "Networking",
      "Private Link",
      "Private Service Connect"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Private Link",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Private Link",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS PrivateLink",
        "providerNamespace": null,
        "pricingServiceName": "AWS PrivateLink",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Private Service Connect",
        "providerNamespace": null,
        "pricingServiceName": "Private Service Connect",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.route-server",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Transit Gateway",
      "AWS Transit Gateway / VGW BGP",
      "Cloud Router",
      "Networking",
      "Route Server",
      "VGW BGP"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Route Server",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Route Server",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Transit Gateway / VGW BGP",
        "providerNamespace": null,
        "pricingServiceName": "AWS Transit Gateway",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Router",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Router",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.traffic-manager",
    "componentType": "load_balancer",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon Route 53 (traffic policies)",
      "Cloud DNS + Traffic Director",
      "Networking",
      "Route 53",
      "Traffic Manager"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Traffic Manager",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Traffic Manager",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon Route 53 (traffic policies)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon Route 53 (traffic policies)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud DNS + Traffic Director",
        "providerNamespace": null,
        "pricingServiceName": "Cloud DNS + Traffic Director",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "network.private",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon VPC",
      "Networking",
      "VPC",
      "Virtual Network",
      "Virtual Private Cloud",
      "Virtual Private Cloud (VPC)"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Virtual Network",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Virtual Network",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon VPC",
        "providerNamespace": null,
        "pricingServiceName": "Amazon VPC",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Virtual Private Cloud (VPC)",
        "providerNamespace": null,
        "pricingServiceName": "Virtual Private Cloud (VPC)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.virtual-wan",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Transit Gateway",
      "Network Connectivity Center",
      "Networking",
      "Virtual WAN"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Virtual WAN",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "Virtual WAN",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Transit Gateway",
        "providerNamespace": null,
        "pricingServiceName": "AWS Transit Gateway",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Network Connectivity Center",
        "providerNamespace": null,
        "pricingServiceName": "Network Connectivity Center",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "networking.vnet-manager",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS VPC IP Address Manager",
      "AWS VPC IP Address Manager (IPAM)",
      "Networking",
      "VNet Manager",
      "VPC Network Peering",
      "VPC Network Peering / No direct"
    ],
    "providers": {
      "azure": {
        "canonicalName": "VNet Manager",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "VNet Manager",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS VPC IP Address Manager (IPAM)",
        "providerNamespace": null,
        "pricingServiceName": "AWS VPC IP Address Manager (IPAM)",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "VPC Network Peering / No direct",
        "providerNamespace": null,
        "pricingServiceName": "VPC Network Peering",
        "serviceFamily": "Networking",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      }
    }
  },
  {
    "serviceKey": "networking.vpn-gateway",
    "componentType": "network",
    "sourceCategory": "Networking",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Site-to-Site VPN",
      "AWS Site-to-Site VPN / Client VPN",
      "Client VPN",
      "Cloud VPN",
      "Networking",
      "VPN Gateway"
    ],
    "providers": {
      "azure": {
        "canonicalName": "VPN Gateway",
        "providerNamespace": "Microsoft.Network",
        "pricingServiceName": "VPN Gateway",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Site-to-Site VPN / Client VPN",
        "providerNamespace": null,
        "pricingServiceName": "AWS Site-to-Site VPN",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud VPN",
        "providerNamespace": null,
        "pricingServiceName": "Cloud VPN",
        "serviceFamily": "Networking",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.azure-elastic-san",
    "componentType": "block_storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon EBS (volumes pool)",
      "Azure Elastic SAN",
      "EBS",
      "Elastic SAN",
      "Persistent Disk",
      "Persistent Disk / No direct SAN",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Elastic SAN",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Elastic SAN",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon EBS (volumes pool)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon EBS (volumes pool)",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Persistent Disk / No direct SAN",
        "providerNamespace": null,
        "pricingServiceName": "Persistent Disk",
        "serviceFamily": "Storage",
        "mappingStatus": "manual_review",
        "notes": "Source mapping includes a no-direct note. Review before client proposal."
      }
    }
  },
  {
    "serviceKey": "storage.azure-netapp-files",
    "componentType": "file_storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon FSx for NetApp ONTAP",
      "Azure NetApp Files",
      "FSx for NetApp ONTAP",
      "NetApp Cloud Volumes",
      "NetApp Cloud Volumes (GCNV)",
      "NetApp Files",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure NetApp Files",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "NetApp Files",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon FSx for NetApp ONTAP",
        "providerNamespace": null,
        "pricingServiceName": "Amazon FSx for NetApp ONTAP",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "NetApp Cloud Volumes (GCNV)",
        "providerNamespace": null,
        "pricingServiceName": "NetApp Cloud Volumes (GCNV)",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.azure-storage-blob-queue-table-files",
    "componentType": "queue",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon S3 + SQS + DynamoDB + EFS",
      "Azure Storage (Blob/Queue/Table/Files)",
      "Cloud Storage + Pub",
      "Cloud Storage + Pub/Sub + Firestore + Filestore",
      "S3 + SQS + DynamoDB + EFS",
      "Storage",
      "Sub + Firestore + Filestore"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Azure Storage (Blob/Queue/Table/Files)",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Storage (Blob/Queue/Table/Files)",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon S3 + SQS + DynamoDB + EFS",
        "providerNamespace": null,
        "pricingServiceName": "Amazon S3 + SQS + DynamoDB + EFS",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Storage + Pub/Sub + Firestore + Filestore",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Storage + Pub/Sub + Firestore + Filestore",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.confidential-ledger",
    "componentType": "storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon QLDB (Quantum Ledger DB)",
      "Confidential Ledger",
      "QLDB",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Confidential Ledger",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Confidential Ledger",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon QLDB (Quantum Ledger DB)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon QLDB (Quantum Ledger DB)",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "No direct equivalent",
        "providerNamespace": null,
        "pricingServiceName": null,
        "serviceFamily": "Storage",
        "mappingStatus": "no_direct_equivalent",
        "notes": "No direct equivalent in the source mapping."
      }
    }
  },
  {
    "serviceKey": "storage.container-storage",
    "componentType": "storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS EBS CSI + EFS CSI for K8s",
      "Container Storage",
      "GKE Persistent Volumes",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Container Storage",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Container Storage",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS EBS CSI + EFS CSI for K8s",
        "providerNamespace": null,
        "pricingServiceName": "AWS EBS CSI + EFS CSI for K8s",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "GKE Persistent Volumes",
        "providerNamespace": null,
        "pricingServiceName": "GKE Persistent Volumes",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.data-lake-storage-gen2",
    "componentType": "object_storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon S3 + AWS Lake Formation",
      "Cloud Storage + BigQuery",
      "Data Lake Storage Gen2",
      "S3 + AWS Lake Formation",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Data Lake Storage Gen2",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Data Lake Storage Gen2",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon S3 + AWS Lake Formation",
        "providerNamespace": null,
        "pricingServiceName": "Amazon S3 + AWS Lake Formation",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Storage + BigQuery",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Storage + BigQuery",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.data-share",
    "componentType": "storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Data Exchange",
      "Analytics Hub",
      "Analytics Hub / BigQuery Data Clean Rooms",
      "BigQuery Data Clean Rooms",
      "Data Share",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Data Share",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Data Share",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Data Exchange",
        "providerNamespace": null,
        "pricingServiceName": "AWS Data Exchange",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Analytics Hub / BigQuery Data Clean Rooms",
        "providerNamespace": null,
        "pricingServiceName": "Analytics Hub",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "block_storage",
    "componentType": "block_storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon EBS (Elastic Block Store)",
      "EBS",
      "Managed Disks",
      "Persistent Disk",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Managed Disks",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Managed Disks",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon EBS (Elastic Block Store)",
        "providerNamespace": null,
        "pricingServiceName": "Amazon EBS (Elastic Block Store)",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Persistent Disk",
        "providerNamespace": null,
        "pricingServiceName": "Persistent Disk",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.managed-lustre",
    "componentType": "storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon FSx for Lustre",
      "FSx for Lustre",
      "Managed Lustre",
      "Parallelstore",
      "Storage"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Managed Lustre",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Managed Lustre",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon FSx for Lustre",
        "providerNamespace": null,
        "pricingServiceName": "Amazon FSx for Lustre",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Parallelstore",
        "providerNamespace": null,
        "pricingServiceName": "Parallelstore",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.storage-actions",
    "componentType": "storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "Amazon S3 Batch Operations",
      "Cloud Storage Batch Operations",
      "S3 Batch Operations",
      "Storage",
      "Storage Actions"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Storage Actions",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Storage Actions",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "Amazon S3 Batch Operations",
        "providerNamespace": null,
        "pricingServiceName": "Amazon S3 Batch Operations",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Storage Batch Operations",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Storage Batch Operations",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  },
  {
    "serviceKey": "storage.storage-discovery",
    "componentType": "storage",
    "sourceCategory": "Storage",
    "mappingStatus": "mapped",
    "aliases": [
      "AWS Storage Lens",
      "AWS Storage Lens / S3 Inventory",
      "Cloud Storage Insights",
      "S3 Inventory",
      "Storage",
      "Storage Discovery"
    ],
    "providers": {
      "azure": {
        "canonicalName": "Storage Discovery",
        "providerNamespace": "Microsoft.Storage",
        "pricingServiceName": "Storage Discovery",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "aws": {
        "canonicalName": "AWS Storage Lens / S3 Inventory",
        "providerNamespace": null,
        "pricingServiceName": "AWS Storage Lens",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      },
      "gcp": {
        "canonicalName": "Cloud Storage Insights",
        "providerNamespace": null,
        "pricingServiceName": "Cloud Storage Insights",
        "serviceFamily": "Storage",
        "mappingStatus": "mapped"
      }
    }
  }
];
