# Incident Response Report

## 1. PREPARATION

### Tools and Detection Capabilities Deployed
- A Python-based network traffic analyzer using Scapy was deployed to monitor live network traffic.
- Detection rules for identifying PORT_SCAN and SYN_FLOOD attacks were implemented.

### Detection Thresholds Configured
- Detection thresholds were set to trigger alerts when a source IP contacted more than 15 unique destination ports within 60 seconds (PORT_SCAN) or when a source IP sent more than 50 TCP SYN packets within 5 seconds (SYN_FLOOD).

### Monitored Assets
- Monitored assets included the network infrastructure where the network traffic analyzer was deployed.

## 2. DETECTION & ANALYSIS

### Timeline of Events
- The following alerts were detected on the current date:
  - PORT_SCAN by source IP 10.0.0.99 at 01:05:08 UTC and 02:31:21 UTC.
  - PORT_SCAN by source IP 127.0.0.1 at various timestamps.
  - SYN_FLOOD by source IP 10.0.0.99 at 01:05:11 UTC and 02:31:23 UTC.

### Analysis of Alert Types
- **PORT_SCAN:**
  - Source IP 10.0.0.99 and 127.0.0.1 initiated multiple port scans by contacting more than 15 unique destination ports within 60 seconds.
- **SYN_FLOOD:**
  - Source IP 10.0.0.99 generated a high volume of TCP SYN packets, exceeding the threshold of 50 packets within 5 seconds.

### Severity Assessment
- The severity of the alerts was classified as HIGH due to the potential impact on network availability and security.

### Attack Pattern Analysis
- The attackers attempted to scan multiple ports and flood the network with TCP SYN packets, indicating reconnaissance and potential denial-of-service (DoS) attacks.

### Supporting Evidence from Packet Data
- Packet data captured by the network traffic analyzer corroborates the alerts generated for PORT_SCAN and SYN_FLOOD attacks.

## 3. CONTAINMENT

### Immediate Containment Actions Recommended
- Block the source IPs (10.0.0.99 and 127.0.0.1) at the network perimeter to prevent further malicious activity.
- Implement firewall rules to restrict outbound traffic from the affected source IPs.

### Short Term Containment Steps
- Conduct a thorough review of network logs to identify any additional compromised systems.
- Change passwords for critical systems and accounts to prevent unauthorized access.

### Evidence Preservation Steps
- Preserve packet capture data and logs related to the alerts for further analysis and investigation.
- Document all actions taken during the containment phase for future reference.

## 4. ERADICATION

### Root Cause Analysis
- Investigate the source of the PORT_SCAN and SYN_FLOOD attacks to identify vulnerabilities or misconfigurations that allowed the malicious activity.
- Determine if any compromised systems need to be isolated or restored from backups.

### Steps to Remove the Threat
- Patch any identified vulnerabilities or misconfigurations that could have been exploited by the attackers.
- Conduct a comprehensive security audit to ensure all systems are secure and free from malware.

## 5. RECOVERY

### Steps to Restore Normal Operations
- Gradually restore network services while monitoring for any signs of continued malicious activity.
- Verify that the threat has been eliminated by monitoring network traffic and system logs.

### Verification of Threat Elimination
- Perform regular security assessments and penetration testing to validate the effectiveness of the implemented security measures.
- Review incident response procedures and update them based on lessons learned from this incident.

### Monitoring Recommendations Post-Recovery
- Implement continuous monitoring of network traffic for any unusual patterns or suspicious activity.
- Enhance network security measures to prevent similar attacks in the future.

## 6. POST-INCIDENT ACTIVITY

### Lessons Learned
- Enhance network segmentation to limit the impact of potential attacks.
- Improve incident response procedures to facilitate quicker detection and response to security incidents.

### Detection Rule Improvements
- Refine detection rules to include additional criteria for identifying anomalous network behavior.
- Implement automated alerts for immediate notification of potential security incidents.

### Known Limitations of the Detection System
- The current detection system may have limitations in detecting sophisticated or stealthy attacks that evade traditional detection mechanisms.
- Regularly update detection rules and tools to address emerging threats and vulnerabilities.

### Recommendations for Future Improvements
- Invest in threat intelligence feeds to proactively identify and mitigate potential threats.
- Conduct regular security training for network administrators and users to enhance overall security awareness.

---
This incident response report provides a comprehensive analysis of the detected PORT_SCAN and SYN_FLOOD attacks, outlining the steps taken in each phase of the NIST SP 800-61 incident response framework. The recommendations and actions proposed aim to mitigate the immediate threats, eradicate the root causes, and enhance the overall security posture of the network infrastructure.