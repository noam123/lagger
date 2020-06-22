Lagger is a small logs formatter which help viewing and customizing live and filed logs in a human readable format. 


###Installation
- Compile with tsc
- npm install . -g

###Supported Consoles
- Git bash 
- Zsh

###Lagger + K8S Usage
####Prerequisites
- bash 4 or higher
- Please make sure you've linked/copied/moved kube.sh to `usr/local/bin`


####Logs
    kube logs <namespace> <pod_query> <OPTIONS>

###Notes
 - For git bash/zsh colors support use environment variable FORCE_COLOR with any value to force color.
 - When using k8s contexts each context should be separated into a different configmap file.

###RELEASE NOTES

**TBD**
 
 - use yargs
 - [aws] use stage/service name to get all lamdas logs, add lambda and service names as tags   
 - check if distinct nodes can be grepped (api | payments) and viewed both cosolidated and separated
 - publish to npm
 - move args handling to configuration-utils.
 - add 'none' formatter type (just print as is)
 - add 'standard' formatter formattes timestamp|time level and message|msg
 - expose FORMATTER_TYPE env var for your cf & make standard defualt
 - add config file to kube for mapping pod to lagger format (rabbit=standard, api=cf, engine=none) 
 - add lagger config file (~/.lagger/lagger-config.json) for custom formatter fields 
    i.e ({customFormatter: [timestamp, level, jimmy]}), add corresponding 'custom' formatter type. 

 **2.1.0**
 - Support AWS Lambda log streams (formatter: aws-lambda)

 **2.0.0**
 - Support kube watch option(-w).
 - Support silent formatter erros and environment variable option(-s, LAGGER_SILENT_FORMATTER_OPTIONS).
 - [Breaking Changes] Refactored -f option to -o/--output. 

 **1.3.0**
 - Support logs custom tags.
 - Support kube consolidate logs from multiple pods ('-c' option).  

 **1.2.0** 
  - Moved to TS.
  - Support multiple formatters.
  - Added CF formatter and set it as default.
 
 **1.0.5**
  - Fixed 'level of undefined' bug.
  - Cosmetics.
  
 **1.0.4**
 - Added performance hit support.
 - Added -h flag for command line usage.

 **1.0.3**
 - Fix new line breaks log.

 
  

