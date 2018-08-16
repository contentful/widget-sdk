#!/usr/bin/env groovy

@Library('contentful-jenkins-lib@master') _

pipeline {
  agent {
    kubernetes {
      label buildId('isolated')
      yaml k8sDeclarativeConfig(type: 'isolated')
    }
  }
  parameters {
    string(name: 'ui_version', defaultValue: 'master', description: 'This will run tests only for the exact package of <a href=https://github.com/contentful/user_interface>user_interface</a> provided with git commit hash.')
    string(name: 'e2e_version', defaultValue: 'master', description: 'E2E Tests image version')
  }
  options {
    timestamps()
    timeout(time: 1, unit: 'HOURS')
  }
  stages {
    stage('Notify E2E job started') {
      steps {
        githubNotification(repo: 'user_interface', sha: params.ui_version, context: "ci/jenkins/${JOB_NAME}: pricing_v1", description: 'UI Tests in Isolated Environment')
        githubNotification(repo: 'user_interface', sha: params.ui_version, context: "ci/jenkins/${JOB_NAME}: pricing_v2", description: 'UI Tests in Isolated Environment')
      }
    }
    stage('Prepare Isolated Environment') {
      environment {
        USER_INTERFACE_VERSION = "${params.ui_version}"
        E2E_TESTS_VERSION = "${params.e2e_version}"
        MARKETING_WEBSITE_VERSION = 'master'
        GATEKEEPER_VERSION = 'production'
        CONTENT_API_VERSION = 'production'
        SHAREJS_VERSION = 'production'
      }
      steps {
        script {
          labPrepare {
            labVersion = 'master'
            dockerComposeVersion = '1.14.0'
          }
        }
      }
    }
    stage('Run dependent tests on Staging environment') {
      steps {
        build job: 'user-interface-dependent', wait: false, parameters: [
          string(name: 'upstream', value: JOB_NAME),
          string(name: 'ui_version', value: "${params.ui_version}")
        ]
      }
    }
    stage('Run E2E tests') {
      steps {
        parallel(
          'pricing_v1': {
            script {
              def sha = "${params.ui_version}"
              def context = "ci/jenkins/${JOB_NAME}: pricing_v1"
              runPyTest {
                id = 'v1'
                lab = true
                arguments = '--pricing=v1'
                keywords = 'not v2'
                notifyIndividually = [
                  repo: 'user_interface',
                  sha: sha,
                  context: context
                ]
              }
            }
          },
          'pricing_v2': {
            script {
              def sha = "${params.ui_version}"
              def context = "ci/jenkins/${JOB_NAME}: pricing_v2"
              runPyTest {
                id = 'v2'
                lab = true
                arguments = '--pricing=v2'
                keywords = 'v2'
                notifyIndividually = [
                  repo: 'user_interface',
                  sha: sha,
                  context: context
                ]
              }
            }
          }
        )
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
    }
    changed {
      slackNotification('#dev-qa-bots, #dev-frontend-bots')
    }
    failure {
      containerLog 'jnlp'
      containerLog 'dind'
    }
  }
}
