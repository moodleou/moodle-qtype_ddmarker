<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Test helpers for the drag-and-drop markers question type.
 *
 * @package    qtype
 * @subpackage ddmarker
 * @copyright  2012 The Open University
 * @author     Jamie Pratt <me@jamiep.org>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();


/**
 * Test helper class for the drag-and-drop markers question type.
 *
 * @copyright  2010 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qtype_ddmarker_test_helper extends question_test_helper {
    public function get_test_questions() {
        return array('fox', 'maths');
    }

    /**
     * @return qtype_ddmarker_question
     */
    public function make_ddmarker_question_fox() {
        question_bank::load_question_definition_classes('ddmarker');
        $dd = new qtype_ddmarker_question();

        test_question_maker::initialise_a_question($dd);

        $dd->name = 'Drag-and-drop markers question';
        $dd->questiontext = 'The quick brown fox jumped over the lazy dog.';
        $dd->generalfeedback = 'This sentence uses each letter of the alphabet.';
        $dd->qtype = question_bank::get_qtype('ddmarker');

        $dd->shufflechoices = true;

        test_question_maker::set_standard_combined_feedback_fields($dd);

        $dd->choices = $this->make_choice_structure(array(
                    new qtype_ddmarker_drag_item('quick', 1, 0),
                    new qtype_ddmarker_drag_item('fox', 2, 0),
                    new qtype_ddmarker_drag_item('lazy', 3, 0)

        ));

        $dd->places = $this->make_place_structure(array(
                            new qtype_ddmarker_drop_zone(1, 'circle', '50,50;50'),
                            new qtype_ddmarker_drop_zone(2, 'rectangle', '100,0;100,100'),
                            new qtype_ddmarker_drop_zone(3, 'polygon', '0,100;200,100;200,200;0,200')
        ));
        $dd->rightchoices = array(1 => 1, 2 => 2, 3 => 3);

        return $dd;
    }

    protected function make_choice_structure($choices) {
        $choicestructure = array();
        foreach ($choices as $choice) {
            $group = $choice->choice_group();
            if (!isset($choicestructure[$group])) {
                $choicestructure[$group] = array();
            }
            $choicestructure[$group][$choice->no] = $choice;
        }
        return $choicestructure;
    }

    protected function make_place_structure($places) {
        $placestructure = array();
        foreach ($places as $place) {
            $placestructure[$place->no] = $place;
        }
        return $placestructure;
    }

    /**
     * @return qtype_ddmarker_question
     */
    public function make_ddmarker_question_maths() {
        question_bank::load_question_definition_classes('ddmarker');
        $dd = new qtype_ddmarker_question();

        test_question_maker::initialise_a_question($dd);

        $dd->name = 'Drag-and-drop markers question';
        $dd->questiontext = 'Fill in the operators to make this equation work: ';
        $dd->generalfeedback = 'Hmmmm...';
        $dd->qtype = question_bank::get_qtype('ddmarker');

        $dd->shufflechoices = true;

        test_question_maker::set_standard_combined_feedback_fields($dd);

        $dd->choices = $this->make_choice_structure(array(
                    new qtype_ddmarker_drag_item('+', 1, 1),
                    new qtype_ddmarker_drag_item('-', 2, 1),
                    new qtype_ddmarker_drag_item('*', 3, 1),
                    new qtype_ddmarker_drag_item('/', 4, 1)

        ));

        $dd->places = $this->make_place_structure(array(
                    new qtype_ddmarker_drop_zone(1, 'circle', '50,50;50'),
                    new qtype_ddmarker_drop_zone(2, 'rectangle', '100,0;100,100'),
                    new qtype_ddmarker_drop_zone(3, 'polygon', '0,100;100,100;100,200;0,200')
        ));
        $dd->rightchoices = array(1 => 1, 2 => 1, 3 => 1);

        return $dd;
    }
}
