pipeline {

agent any

stages {

stage('Install') {
steps {
sh 'npm install'
}
}

stage('Run') {
steps {
sh 'node index.js &'
}
}

}

post {

success {
echo 'Poultry website started successfully'
}

failure {
echo 'Build failed'
}

}

}
