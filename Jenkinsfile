#!/usr/bin/env groovy

@Library('contentful-jenkins-lib@master') _

pipeline {
  agent none
  parameters {
    string(name: 'sha', defaultValue: 'master')
    string(name: 'repository', defaultValue: 'user_interface')
    string(name: 'ref', defaultValue: 'master')
    booleanParam(name: 'runPipeline', defaultValue: false)
  }
  triggers {
    GenericTrigger(
     genericVariables: [
      [key: 'ref', value: '$.ref'],
      [key: 'repository', value: '$.repository'],
      [key: 'sha', value: '$.sha'],
      [key: 'runPipeline', value: '$.runPipeline'],
     ],
     regexpFilterExpression: 'user_interface/' + BRANCH_NAME,
     regexpFilterText: '$repository/$ref',
    )
  }
  options {
    timestamps()
    timeout(time: 1, unit: 'HOURS')
    buildDiscarder(logRotator(artifactNumToKeepStr: '5', numToKeepStr: env.BRANCH_NAME ==~ /(master)/ ? '30' : '5'))
  }
  stages {
    stage('Execute Pipeline') {
      agent {
        kubernetes {
          label buildId('isolated')
          yaml k8sDeclarativeConfig(type: 'isolated')
        }
      }
      when {
        beforeAgent true
        expression { return params.runPipeline }
      }
      stages {
        stage('Notify E2E job created') {
          steps {
            githubNotification(repo: 'user_interface', sha: params.sha, context: "ci/jenkins/e2e: pricing_v1", description: 'UI Tests in Isolated Environment')
            githubNotification(repo: 'user_interface', sha: params.sha, context: "ci/jenkins/e2e: pricing_v2", description: 'UI Tests in Isolated Environment')
          }
        }
        stage('Prepare Isolated Environment') {
          environment {
            USER_INTERFACE_VERSION = "${params.sha}"
            MARKETING_WEBSITE_VERSION = 'master'
            GATEKEEPER_VERSION = 'production'
            CONTENT_API_VERSION = 'production'
            SHAREJS_VERSION = 'production'
            STATE_PERSISTENCE_API_VERSION = 'master'
          }
          steps {
            script {
              labPrepare {
                labVersion = 'master'
              }
            }
          }
        }
        stage('Run E2E tests') {
          steps {
            script {
              def sha = "${params.sha}"
              parallel(
                'pricing_v1': {
                  runPyTest {
                    id = 'v1'
                    lab = true
                    arguments = '--pricing=v1'
                    keywords = 'not v2'
                    notifyIndividually = [
                      repo: 'user_interface',
                      sha: sha,
                      context: 'ci/jenkins/e2e: pricing_v1'
                    ]
                  }
                },
                'pricing_v2': {
                  def context = "ci/jenkins/e2e: pricing_v2"
                  runPyTest {
                    id = 'v2'
                    lab = true
                    arguments = '--pricing=v2'
                    keywords = 'v2'
                    notifyIndividually = [
                      repo: 'user_interface',
                      sha: sha,
                      context: 'ci/jenkins/e2e: pricing_v2'
                    ]
                  }
                }
              )
            }
          }
          post {
            always {
              archiveArtifacts(allowEmptyArchive: true, artifacts: "reports/**")
            }
          }
        }
      }
      post {
        always {
          publishHTML([
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'reports',
            reportName: 'HTML Report',
            reportFiles: 'reports_v1/index.html, reports_v2/index.html',
            reportTitles: 'Report for v1, Report for v2'])
          labStoreLogs()
          build job: 'user-interface-sniffer', wait: false, parameters: [
            string(name: 'sha', value: params.sha),
            string(name: 'job', value: env.JOB_NAME)
          ]
        }
        changed {
          slackNotification('#dev-qa-bots, #dev-frontend-bots')
        }
        failure {
          emailNotification()
        }
      }
    }
  }
}
