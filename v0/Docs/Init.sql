DROP DATABASE IF EXISTS CHSdb;
CREATE DATABASE CHSdb;
USE CHSdb;

CREATE TABLE Person (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  firstName      VARCHAR(30),
  lastName       VARCHAR(30)  NOT NULL,
  email          VARCHAR(30)  NOT NULL,
  password       VARCHAR(50),
  whenRegistered DATETIME     NOT NULL,
  termsAccepted  DATETIME,
  role           INT UNSIGNED NOT NULL, # 0 normal, 1 admin
  UNIQUE KEY (email)
);

CREATE TABLE Conversation
(
  id          INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  title       VARCHAR(80)         NOT NULL,
  ownerId     INT(11)             NOT NULL,
  lastMessage DATETIME,
  UNIQUE KEY UK_title (title)
);

CREATE TABLE Message (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  cnvId    INT           NOT NULL,
  prsId    INT           NOT NULL,
  whenMade DATETIME      NOT NULL,
  content  VARCHAR(5000) NOT NULL,
  CONSTRAINT FKMessage_cnvId FOREIGN KEY (cnvId) REFERENCES Conversation (id)
    ON DELETE CASCADE,
  CONSTRAINT FKMessage_prsId FOREIGN KEY (prsId) REFERENCES Person (id)
    ON DELETE CASCADE
);

INSERT INTO Person (firstName, lastName, email, password, whenRegistered, role)
VALUES ("Joe", "Admin", "adm@11.com", "password", NOW(), 1);